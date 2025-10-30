import { toast } from "sonner";

// Tour Passenger Validation
export interface TourPassenger {
  fullName: string;
  phone?: string;
  email?: string;
  gender: string;
  dateOfBirth: string;
  cccd?: string;
  type: "adult" | "child" | "infant";
}

export const validateTourPassengers = (
  passengers: TourPassenger[]
): boolean => {
  const hasEmptyFields = passengers.some((passenger, index) => {
    // First passenger (contact person), check all required fields
    if (index === 0) {
      return (
        !passenger.fullName.trim() ||
        !passenger.phone?.trim() ||
        !passenger.email?.trim() ||
        !passenger.gender.trim() ||
        !passenger.dateOfBirth.trim()
      );
    }
    // For other passengers, only check name, gender and date of birth
    return (
      !passenger.fullName.trim() ||
      !passenger.gender.trim() ||
      !passenger.dateOfBirth.trim()
    );
  });

  if (hasEmptyFields) {
    toast.error("Vui lòng nhập đầy đủ thông tin tất cả hành khách!");
    return false;
  }
  return true;
};

// Flight Passenger Validation
export interface FlightPassenger {
  fullName: string;
  phoneNumber?: string;
  email?: string;
  gender: "Nam" | "Nữ" | "";
  dateOfBirth: string;
  identityNumber?: string;
  nationality?: string;
}

export const validateFlightPassengers = (
  passengers: FlightPassenger[],
  adults: number
): boolean => {
  const hasEmptyFields = passengers.some((passenger, index) => {
    // First passenger (contact person - always adult)
    if (index === 0) {
      return (
        !passenger.fullName.trim() ||
        !passenger.phoneNumber?.trim() ||
        !passenger.email?.trim() ||
        !passenger.gender.trim() ||
        !passenger.dateOfBirth.trim() ||
        !passenger.identityNumber?.trim()
      );
    }

    // Other passengers
    // Adults need CCCD, but children and infants don't
    const isAdult = index < adults;
    if (isAdult) {
      return (
        !passenger.fullName.trim() ||
        !passenger.gender.trim() ||
        !passenger.dateOfBirth.trim() ||
        !passenger.identityNumber?.trim()
      );
    } else {
      // Children and infants don't need CCCD
      return (
        !passenger.fullName.trim() ||
        !passenger.gender.trim() ||
        !passenger.dateOfBirth.trim()
      );
    }
  });

  if (hasEmptyFields) {
    toast.error("Vui lòng nhập đầy đủ thông tin tất cả hành khách!");
    return false;
  }
  return true;
};

// Activity Participant Validation
export interface ActivityParticipant {
  fullName: string;
  phone?: string;
  email?: string;
  gender: string;
  dateOfBirth: string;
  cccd?: string;
  type: "adult" | "child" | "baby" | "senior";
}

export const validateActivityParticipants = (
  participants: ActivityParticipant[]
): boolean => {
  const hasEmptyFields = participants.some((participant, index) => {
    if (index === 0) {
      return (
        !participant.fullName.trim() ||
        !participant.phone?.trim() ||
        !participant.email?.trim() ||
        !participant.gender.trim() ||
        !participant.dateOfBirth.trim()
      );
    }
    return (
      !participant.fullName.trim() ||
      !participant.gender.trim() ||
      !participant.dateOfBirth.trim()
    );
  });

  if (hasEmptyFields) {
    toast.error("Vui lòng nhập đầy đủ thông tin tất cả người tham gia!");
    return false;
  }
  return true;
};

// Common Validation
export const validatePaymentMethod = (paymentMethod: string): boolean => {
  if (!paymentMethod) {
    toast.error("Vui lòng chọn hình thức thanh toán!");
    return false;
  }
  return true;
};

export const validateScheduledDate = (scheduledDate: string): boolean => {
  if (!scheduledDate) {
    toast.error("Vui lòng chọn ngày tham gia!");
    return false;
  }
  return true;
};
