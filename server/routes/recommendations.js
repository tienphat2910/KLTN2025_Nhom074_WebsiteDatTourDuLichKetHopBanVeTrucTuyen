const express = require('express');
const auth = require('../middleware/auth');
const Tour = require('../models/Tour');
const Booking = require('../models/Booking');

const router = express.Router();

/**
 * GET /api/recommendations/personalized
 * Returns personalized tour recommendations and simple upsell bundles.
 * Requires auth (uses req.user._id).
 */
router.get('/personalized', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    // Basic heuristic recommender:
    // 1) Find recent tour bookings by the user to infer preferred destinations
    // 2) If none, return featured tours
    // 3) Provide simple upsell bundles (flight/insurance/pickup) for each tour

    // Fetch user's recent tour bookings
    const userBookings = await Booking.find({ userId }).sort({ createdAt: -1 }).limit(20).lean();

    // Collect destinations or tourIds from bookings if available
    const preferredDestinations = new Set();
    const preferredTourIds = new Set();
    userBookings.forEach((b) => {
      if (b.destination) preferredDestinations.add(b.destination);
      if (b.tourId) preferredTourIds.add(String(b.tourId));
    });

    // Candidate tours: if user has preferred destinations, prioritize those
    let candidates = [];
    if (preferredDestinations.size > 0) {
      const dests = Array.from(preferredDestinations);
      candidates = await Tour.find({ destination: { $in: dests }, isActive: true }).limit(20).lean();
    }

    // Fallback to featured tours when no candidates
    if (!candidates || candidates.length === 0) {
      candidates = await Tour.find({ isActive: true }).sort({ featured: -1, createdAt: -1 }).limit(20).lean();
    }

    // Build recommendation items with simple score and suggested upsells
    const recommendations = candidates.slice(0, 10).map((t) => {
      return {
        id: t._id,
        title: t.title || t.name || t.slug || 'Tour',
        slug: t.slug || null,
        thumbnail: (t.images && t.images[0]) || t.image || null,
        price: t.price || (t.retail && t.retail.adult) || 0,
        duration: t.duration || null,
        reason: preferredTourIds.has(String(t._id)) ? 'Bạn đã quan tâm tour tương tự trước đó' : 'Gợi ý cho bạn',
        upsells: [
          { type: 'flight', label: 'Đặt vé máy bay', priceDelta: 0 },
          { type: 'insurance', label: 'Bảo hiểm du lịch', priceDelta: 150000 },
          { type: 'transfer', label: 'Đưa đón sân bay', priceDelta: 200000 }
        ]
      };
    });

    res.json({ success: true, data: { recommendations } });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Upsell endpoint: activities and flight CTA for a destination
router.get('/upsell', auth, async (req, res) => {
  try {
    const { destinationId, destinationSlug } = req.query;
    const Activity = require('../models/Activity');
    const Destination = require('../models/Destination');

    let destId = destinationId;
    if (!destId && destinationSlug) {
      const dest = await Destination.findOne({ slug: destinationSlug }).lean();
      if (dest) destId = dest._id;
    }

    if (!destId) {
      return res.status(400).json({ success: false, message: 'destinationId or destinationSlug required' });
    }

    // Find popular activities for this destination
    const activities = await Activity.find({ destinationId: destId, isActive: true }).sort({ popularity: -1, createdAt: -1 }).limit(6).lean();

    // For flights, we return a CTA with destination slug (frontend can link to /flights?to=slug)
    const DestinationModel = require('../models/Destination');
    const dest = await DestinationModel.findById(destId).lean();
    const flightsCTA = dest ? { label: `Tìm vé tới ${dest.name}`, destinationSlug: dest.slug } : null;

    res.json({ success: true, data: { activities, flightsCTA } });
  } catch (error) {
    console.error('Upsell error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
