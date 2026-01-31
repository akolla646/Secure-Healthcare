/**
 * Mock Patient Database
 * Contains sample patient data for the Clinical Decision Support System
 */

const patients = {
  P001: {
    id: "P001",
    name: "John Smith",
    age: 65,
    gender: "Male",
    allergies: ["Penicillin", "Aspirin"],
    chronicConditions: ["Type 2 Diabetes", "Hypertension"],
    currentMedications: ["Lisinopril", "Metformin"],
    recentLabValues: {
      glucose: 180,
      hba1c: 7.8,
      bloodPressure: "145/92",
      creatinine: 1.1
    }
  },
  P002: {
    id: "P002",
    name: "Sarah Johnson",
    age: 45,
    gender: "Female",
    allergies: ["Sulfa Drugs"],
    chronicConditions: ["Asthma", "Anxiety"],
    currentMedications: ["Albuterol", "Sertraline"],
    recentLabValues: {
      glucose: 95,
      bloodPressure: "118/76",
      peakFlow: 380
    }
  },
  P003: {
    id: "P003",
    name: "Robert Chen",
    age: 72,
    gender: "Male",
    allergies: [],
    chronicConditions: ["Heart Failure", "Type 2 Diabetes", "Chronic Kidney Disease"],
    currentMedications: ["Furosemide", "Carvedilol", "Insulin Glargine"],
    recentLabValues: {
      glucose: 145,
      hba1c: 7.2,
      bloodPressure: "130/80",
      creatinine: 2.4,
      bnp: 850,
      ejectionFraction: 35
    }
  },
  P004: {
    id: "P004",
    name: "Maria Garcia",
    age: 58,
    gender: "Female",
    allergies: ["Penicillin", "Iodine Contrast"],
    chronicConditions: ["Hypothyroidism", "Osteoporosis"],
    currentMedications: ["Levothyroxine", "Alendronate", "Calcium + Vitamin D"],
    recentLabValues: {
      tsh: 2.5,
      t4: 1.2,
      vitaminD: 35,
      boneDensity: -2.8
    }
  },
  P005: {
    id: "P005",
    name: "James Wilson",
    age: 55,
    gender: "Male",
    allergies: ["ACE Inhibitors"],
    chronicConditions: ["Hypertension", "Hyperlipidemia", "Obesity"],
    currentMedications: ["Losartan", "Atorvastatin"],
    recentLabValues: {
      glucose: 110,
      bloodPressure: "138/88",
      ldl: 145,
      hdl: 38,
      triglycerides: 220,
      bmi: 32.5
    }
  }
};

/**
 * Get patient by ID
 * @param {string} patientId - The patient identifier
 * @returns {Object|null} Patient data or null if not found
 */
function getPatientById(patientId) {
  return patients[patientId] || null;
}

/**
 * Get all patients (for patient selector dropdown)
 * @returns {Array} Array of patient summaries
 */
function getAllPatients() {
  return Object.values(patients).map(p => ({
    id: p.id,
    name: p.name,
    age: p.age,
    chronicConditions: p.chronicConditions
  }));
}

module.exports = {
  patients,
  getPatientById,
  getAllPatients
};
