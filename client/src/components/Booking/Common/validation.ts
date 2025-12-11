// Helper function to calculate age
export const calculateAge = (dateOfBirth: string): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
};

// Helper function to validate CCCD (12 digits)
export const validateCCCD = (cccd: string): boolean => {
  return /^\d{12}$/.test(cccd.trim());
};

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

export interface PassengerValidationError {
  index: number;
  field: string;
  message: string;
}

export const validateTourPassengers = (
  passengers: TourPassenger[]
): { isValid: boolean; errors: PassengerValidationError[] } => {
  const errors: PassengerValidationError[] = [];

  // Check empty fields and validate age
  for (let i = 0; i < passengers.length; i++) {
    const passenger = passengers[i];

    // First passenger (contact person), check all required fields
    if (i === 0) {
      if (!passenger.fullName.trim()) {
        errors.push({
          index: i,
          field: "fullName",
          message: "Vui lòng nhập họ và tên"
        });
      }
      if (!passenger.phone?.trim()) {
        errors.push({
          index: i,
          field: "phone",
          message: "Vui lòng nhập số điện thoại"
        });
      }
      if (!passenger.email?.trim()) {
        errors.push({
          index: i,
          field: "email",
          message: "Vui lòng nhập email"
        });
      }
      if (!passenger.gender.trim()) {
        errors.push({
          index: i,
          field: "gender",
          message: "Vui lòng chọn giới tính"
        });
      }
      if (!passenger.dateOfBirth.trim()) {
        errors.push({
          index: i,
          field: "dateOfBirth",
          message: "Vui lòng nhập ngày sinh"
        });
      }
    } else {
      // Other passengers
      if (!passenger.fullName.trim()) {
        errors.push({
          index: i,
          field: "fullName",
          message: "Vui lòng nhập họ và tên"
        });
      }
      if (!passenger.gender.trim()) {
        errors.push({
          index: i,
          field: "gender",
          message: "Vui lòng chọn giới tính"
        });
      }
      if (!passenger.dateOfBirth.trim()) {
        errors.push({
          index: i,
          field: "dateOfBirth",
          message: "Vui lòng nhập ngày sinh"
        });
      }
    }

    // Validate age based on passenger type
    if (passenger.dateOfBirth) {
      const age = calculateAge(passenger.dateOfBirth);

      if (passenger.type === "adult" && age < 16) {
        errors.push({
          index: i,
          field: "dateOfBirth",
          message: "Người lớn phải từ 16 tuổi trở lên"
        });
      }

      if (passenger.type === "child" && (age < 2 || age >= 16)) {
        errors.push({
          index: i,
          field: "dateOfBirth",
          message: "Trẻ em phải từ 2 đến dưới 16 tuổi"
        });
      }

      if (passenger.type === "infant" && age >= 2) {
        errors.push({
          index: i,
          field: "dateOfBirth",
          message: "Em bé phải dưới 2 tuổi"
        });
      }
    }

    // Validate CCCD if provided (12 digits)
    if (passenger.cccd && passenger.cccd.trim() !== "") {
      if (!validateCCCD(passenger.cccd)) {
        errors.push({
          index: i,
          field: "cccd",
          message: "CCCD phải có đúng 12 số"
        });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
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
  seatNumber?: string;
}

export const validateFlightPassengers = (
  passengers: FlightPassenger[],
  adults: number
): { isValid: boolean; errors: PassengerValidationError[] } => {
  const errors: PassengerValidationError[] = [];

  for (let i = 0; i < passengers.length; i++) {
    const passenger = passengers[i];
    const isAdult = i < adults;

    // First passenger (contact person - always adult)
    if (i === 0) {
      if (!passenger.fullName.trim()) {
        errors.push({
          index: i,
          field: "fullName",
          message: "Vui lòng nhập họ và tên"
        });
      }
      if (!passenger.phoneNumber?.trim()) {
        errors.push({
          index: i,
          field: "phoneNumber",
          message: "Vui lòng nhập số điện thoại"
        });
      }
      if (!passenger.email?.trim()) {
        errors.push({
          index: i,
          field: "email",
          message: "Vui lòng nhập email"
        });
      }
      if (!passenger.gender.trim()) {
        errors.push({
          index: i,
          field: "gender",
          message: "Vui lòng chọn giới tính"
        });
      }
      if (!passenger.dateOfBirth.trim()) {
        errors.push({
          index: i,
          field: "dateOfBirth",
          message: "Vui lòng nhập ngày sinh"
        });
      }
      if (!passenger.identityNumber?.trim()) {
        errors.push({
          index: i,
          field: "identityNumber",
          message: "Vui lòng nhập CCCD/Hộ chiếu"
        });
      }
    } else {
      // Other passengers
      if (!passenger.fullName.trim()) {
        errors.push({
          index: i,
          field: "fullName",
          message: "Vui lòng nhập họ và tên"
        });
      }
      if (!passenger.gender.trim()) {
        errors.push({
          index: i,
          field: "gender",
          message: "Vui lòng chọn giới tính"
        });
      }
      if (!passenger.dateOfBirth.trim()) {
        errors.push({
          index: i,
          field: "dateOfBirth",
          message: "Vui lòng nhập ngày sinh"
        });
      }

      // Adults need CCCD
      if (isAdult && !passenger.identityNumber?.trim()) {
        errors.push({
          index: i,
          field: "identityNumber",
          message: "Vui lòng nhập CCCD/Hộ chiếu"
        });
      }
    }

    // Validate age
    if (passenger.dateOfBirth) {
      const age = calculateAge(passenger.dateOfBirth);

      if (isAdult && age < 16) {
        errors.push({
          index: i,
          field: "dateOfBirth",
          message: "Người lớn phải từ 16 tuổi trở lên"
        });
      }

      if (!isAdult && (age < 2 || age >= 16)) {
        errors.push({
          index: i,
          field: "dateOfBirth",
          message: "Trẻ em phải từ 2 đến dưới 16 tuổi"
        });
      }
    }

    // Validate identity number if provided (12 digits for CCCD)
    if (passenger.identityNumber && passenger.identityNumber.trim() !== "") {
      if (!validateCCCD(passenger.identityNumber)) {
        errors.push({
          index: i,
          field: "identityNumber",
          message: "CCCD/Hộ chiếu phải có đúng 12 số"
        });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
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
): { isValid: boolean; errors: PassengerValidationError[] } => {
  const errors: PassengerValidationError[] = [];

  for (let i = 0; i < participants.length; i++) {
    const participant = participants[i];

    // First participant (contact person)
    if (i === 0) {
      if (!participant.fullName.trim()) {
        errors.push({
          index: i,
          field: "fullName",
          message: "Vui lòng nhập họ và tên"
        });
      }
      if (!participant.phone?.trim()) {
        errors.push({
          index: i,
          field: "phone",
          message: "Vui lòng nhập số điện thoại"
        });
      }
      if (!participant.email?.trim()) {
        errors.push({
          index: i,
          field: "email",
          message: "Vui lòng nhập email"
        });
      }
      if (!participant.gender.trim()) {
        errors.push({
          index: i,
          field: "gender",
          message: "Vui lòng chọn giới tính"
        });
      }
      if (!participant.dateOfBirth.trim()) {
        errors.push({
          index: i,
          field: "dateOfBirth",
          message: "Vui lòng nhập ngày sinh"
        });
      }
    } else {
      // Other participants
      if (!participant.fullName.trim()) {
        errors.push({
          index: i,
          field: "fullName",
          message: "Vui lòng nhập họ và tên"
        });
      }
      if (!participant.gender.trim()) {
        errors.push({
          index: i,
          field: "gender",
          message: "Vui lòng chọn giới tính"
        });
      }
      if (!participant.dateOfBirth.trim()) {
        errors.push({
          index: i,
          field: "dateOfBirth",
          message: "Vui lòng nhập ngày sinh"
        });
      }
    }

    // Validate age for each participant type
    if (participant.dateOfBirth) {
      const age = calculateAge(participant.dateOfBirth);

      if (participant.type === "adult" && age < 16) {
        errors.push({
          index: i,
          field: "dateOfBirth",
          message: "Người lớn phải từ 16 tuổi trở lên"
        });
      }

      if (participant.type === "senior" && age < 60) {
        errors.push({
          index: i,
          field: "dateOfBirth",
          message: "Người cao tuổi phải từ 60 tuổi trở lên"
        });
      }

      if (participant.type === "child" && (age < 2 || age >= 16)) {
        errors.push({
          index: i,
          field: "dateOfBirth",
          message: "Trẻ em phải từ 2 đến dưới 16 tuổi"
        });
      }

      if (participant.type === "baby" && age >= 2) {
        errors.push({
          index: i,
          field: "dateOfBirth",
          message: "Em bé phải dưới 2 tuổi"
        });
      }
    }

    // Validate CCCD if provided
    if (participant.cccd && participant.cccd.trim() !== "") {
      if (!validateCCCD(participant.cccd)) {
        errors.push({
          index: i,
          field: "cccd",
          message: "CCCD phải có đúng 12 số"
        });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Amadeus Passenger Validation
export interface AmadeusPassenger {
  type: "ADULT" | "CHILD" | "INFANT";
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  identityNumber?: string;
  email?: string;
  phone?: string;
}

export const validateAmadeusPassengers = (
  passengers: AmadeusPassenger[],
  contactInfo?: { email: string; phone: string }
): { isValid: boolean; errors: PassengerValidationError[] } => {
  const errors: PassengerValidationError[] = [];

  for (let i = 0; i < passengers.length; i++) {
    const passenger = passengers[i];

    if (!passenger.firstName.trim()) {
      errors.push({
        index: i,
        field: "firstName",
        message: "Vui lòng nhập tên"
      });
    }

    if (!passenger.lastName.trim()) {
      errors.push({
        index: i,
        field: "lastName",
        message: "Vui lòng nhập họ"
      });
    }

    if (!passenger.dateOfBirth) {
      errors.push({
        index: i,
        field: "dateOfBirth",
        message: "Vui lòng nhập ngày sinh"
      });
    }

    // Validate age
    if (passenger.dateOfBirth) {
      const age = calculateAge(passenger.dateOfBirth);

      if (passenger.type === "ADULT" && age < 16) {
        errors.push({
          index: i,
          field: "dateOfBirth",
          message: "Người lớn phải từ 16 tuổi trở lên"
        });
      }

      if (passenger.type === "CHILD" && (age < 2 || age >= 16)) {
        errors.push({
          index: i,
          field: "dateOfBirth",
          message: "Trẻ em phải từ 2 đến dưới 16 tuổi"
        });
      }

      if (passenger.type === "INFANT" && age >= 2) {
        errors.push({
          index: i,
          field: "dateOfBirth",
          message: "Em bé phải dưới 2 tuổi"
        });
      }
    }

    // Validate identity number for adults
    if (passenger.type === "ADULT") {
      if (!passenger.identityNumber?.trim()) {
        errors.push({
          index: i,
          field: "identityNumber",
          message: "Vui lòng nhập CCCD/Hộ chiếu"
        });
      } else if (!validateCCCD(passenger.identityNumber)) {
        errors.push({
          index: i,
          field: "identityNumber",
          message: "CCCD/Hộ chiếu phải có đúng 12 số"
        });
      }
    }
  }

  // Validate contact info if provided
  if (contactInfo) {
    if (!contactInfo.email) {
      errors.push({
        index: -1,
        field: "contactEmail",
        message: "Vui lòng nhập email liên hệ"
      });
    }
    if (!contactInfo.phone) {
      errors.push({
        index: -1,
        field: "contactPhone",
        message: "Vui lòng nhập số điện thoại liên hệ"
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Common Validation
export const validatePaymentMethod = (
  paymentMethod: string
): { isValid: boolean; message: string } => {
  if (!paymentMethod) {
    return {
      isValid: false,
      message: "Vui lòng chọn hình thức thanh toán!"
    };
  }
  return { isValid: true, message: "" };
};

export const validateScheduledDate = (
  scheduledDate: string
): { isValid: boolean; message: string } => {
  if (!scheduledDate) {
    return {
      isValid: false,
      message: "Vui lòng chọn ngày tham gia!"
    };
  }
  return { isValid: true, message: "" };
};
