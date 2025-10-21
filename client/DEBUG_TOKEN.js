// Debug script - Paste vào browser console để test token

// 1. Kiểm tra token hiện tại
const token = localStorage.getItem("token");
console.log("🔑 Token exists:", !!token);
console.log("🔑 Token length:", token?.length);
console.log("🔑 Token preview:", token?.substring(0, 50) + "...");

// 2. Parse token để xem thông tin
if (token) {
    try {
        const parts = token.split('.');
        const payload = JSON.parse(atob(parts[1]));
        console.log("📦 Token payload:", payload);
        console.log("👤 User ID:", payload.id);
        console.log("⏰ Issued at:", new Date(payload.iat * 1000));
        console.log("⏰ Expires at:", new Date(payload.exp * 1000));
        console.log("⏰ Is expired:", Date.now() > payload.exp * 1000);
    } catch (e) {
        console.error("❌ Cannot parse token:", e);
    }
}

// 3. Test API với token hiện tại
async function testToken() {
    const token = localStorage.getItem("token");

    // Test 1: Get user profile
    console.log("\n🧪 Test 1: Get user profile");
    try {
        const response = await fetch("http://localhost:5000/api/auth/profile", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        const data = await response.json();
        console.log("Response:", response.status, data);
    } catch (e) {
        console.error("Error:", e);
    }

    // Test 2: Upload image
    console.log("\n🧪 Test 2: Test upload endpoint");
    try {
        const response = await fetch("http://localhost:5000/api/tours/upload-image", {
            method: "OPTIONS",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        console.log("OPTIONS Response:", response.status);
    } catch (e) {
        console.error("Error:", e);
    }
}

// Chạy tests
testToken();

// 4. Hướng dẫn fix
console.log(`
📝 Nếu token hết hạn hoặc không hợp lệ:

1. Đăng xuất và đăng nhập lại:
   localStorage.removeItem("token");
   localStorage.removeItem("user");
   // Reload page và login lại

2. Hoặc copy token mới từ login response và set:
   localStorage.setItem("token", "NEW_TOKEN_HERE");

3. Kiểm tra user role phải là admin:
   const user = JSON.parse(localStorage.getItem("user"));
   console.log("User role:", user?.role);
`);
