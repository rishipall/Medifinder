const https = require("https");
const Medicine = require("../models/Medicine");

// Clinical Expert Fallback Engine
const generateClinicalFallback = (symptoms = [], duration = "1-2 Days", severity = "Moderate", additionalInfo = "") => {
  const symptomList = symptoms.map(s => s.toLowerCase());
  
  let riskLevel = "Low";
  let riskColor = "emerald";
  let possibleConditions = [];
  let suggestedMedicines = [];
  let homeCareAdvice = [
    "Ensure adequate hydration (at least 2.5L water/ORS daily)",
    "Get 8+ hours of restful sleep",
    "Avoid strenuous physical exertion until recovery"
  ];
  let whenToSeeDoctor = "If symptoms persist beyond 3 days or worsen significantly.";

  if (symptomList.some(s => s.includes("chest") || s.includes("breath") || s.includes("shortness") || s.includes("faint")) || severity === "High") {
    riskLevel = "High";
    riskColor = "rose";
    possibleConditions = ["Cardiorespiratory Concern", "Acute Bronchial / Cardiac Distress", "Severe Systemic Infection"];
    suggestedMedicines = [
      { name: "Emergency Evaluation Required", purpose: "Seek immediate emergency medical care", dosageInfo: "Do not self-medicate for acute distress" }
    ];
    homeCareAdvice.unshift("⚠️ SEEK IMMEDIATE EMERGENCY MEDICAL CARE OR CALL LOCAL AMBULANCE");
    whenToSeeDoctor = "IMMEDIATELY. Do not delay medical evaluation.";
  } else if (symptomList.some(s => s.includes("fever") || s.includes("temp") || s.includes("chills"))) {
    riskLevel = severity === "High" ? "High" : "Moderate";
    riskColor = riskLevel === "High" ? "rose" : "amber";
    possibleConditions = ["Viral Fever / Flu", "Seasonal Upper Respiratory Infection", "Inflammatory Response"];
    suggestedMedicines = [
      { name: "Paracetamol", purpose: "Fever reduction and pain relief", dosageInfo: "500mg - 650mg as needed (max 4 times daily)" },
      { name: "Ibuprofen", purpose: "Anti-inflammatory and body pain relief", dosageInfo: "400mg with food every 8 hours if needed" },
      { name: "ORS Hydration Powder", purpose: "Restores electrolyte balance", dosageInfo: "Mix 1 sachet in 1L clean water" }
    ];
    homeCareAdvice.push("Apply lukewarm sponge compresses if fever exceeds 101°F");
    whenToSeeDoctor = "If fever stays above 102°F (38.9°C) for over 48 hours or is accompanied by severe rash/stiff neck.";
  } else if (symptomList.some(s => s.includes("cough") || s.includes("throat") || s.includes("cold"))) {
    riskLevel = "Low";
    riskColor = "emerald";
    possibleConditions = ["Acute Pharyngitis / Sore Throat", "Common Cold / Rhinitis", "Allergic Cough"];
    suggestedMedicines = [
      { name: "Cough Syrup", purpose: "Soothes throat irritation and calms dry cough", dosageInfo: "10ml 3 times daily after meals" },
      { name: "Cetirizine", purpose: "Reduces sneezing, runny nose, and allergic throat tickle", dosageInfo: "10mg once daily at night" },
      { name: "Strepsils Throat Lozenges", purpose: "Local antibacterial throat relief", dosageInfo: "Dissolve 1 lozenge slowly every 3 hours" }
    ];
    homeCareAdvice.push("Gargle with warm salt water 3 times daily");
    homeCareAdvice.push("Use steam inhalation with peppermint/eucalyptus oil");
    whenToSeeDoctor = "If coughing up discolored phlegm, blood, or experiencing persistent wheezing.";
  } else if (symptomList.some(s => s.includes("headache") || s.includes("migraine") || s.includes("brain"))) {
    riskLevel = "Moderate";
    riskColor = "amber";
    possibleConditions = ["Tension Headache", "Migraine Episode", "Dehydration / Eye Strain"];
    suggestedMedicines = [
      { name: "Paracetamol", purpose: "Relieves mild to moderate headache", dosageInfo: "500mg after food" },
      { name: "Dispirin", purpose: "Fast-acting relief for severe throbbing headache", dosageInfo: "1 tablet dissolved in water (avoid on empty stomach)" }
    ];
    homeCareAdvice.push("Rest in a dim, quiet room free from bright screens");
    homeCareAdvice.push("Apply a cool compress across your forehead");
  } else if (symptomList.some(s => s.includes("stomach") || s.includes("digestive") || s.includes("nausea") || s.includes("acidity"))) {
    riskLevel = "Low";
    riskColor = "emerald";
    possibleConditions = ["Acid Reflux / Indigestion", "Mild Gastroenteritis", "Dietary Discomfort"];
    suggestedMedicines = [
      { name: "Pantoprazole", purpose: "Reduces stomach acid secretion", dosageInfo: "40mg 30 mins before breakfast" },
      { name: "Digene Gel Antacid", purpose: "Instant neutralizing relief for acidity and bloating", dosageInfo: "2 teaspoons after meals" },
      { name: "ORS Hydration Powder", purpose: "Prevents fluid loss from nausea/diarrhea", dosageInfo: "Sip continuously throughout the day" }
    ];
    homeCareAdvice.push("Eat light, bland meals (rice, toast, bananas)");
    homeCareAdvice.push("Avoid oily, spicy, acidic foods and caffeine");
  } else {
    riskLevel = "Low";
    riskColor = "emerald";
    possibleConditions = ["General Fatigue / Mild Malaise", "Physical Overexertion", "Seasonal Adjustment"];
    suggestedMedicines = [
      { name: "Multivitamin Syrup", purpose: "Boosts immunity and daily energy", dosageInfo: "1 teaspoon daily after lunch" },
      { name: "Paracetamol", purpose: "Mild ache relief", dosageInfo: "500mg as needed" }
    ];
  }

  const symptomsFormatted = symptoms.length > 0 ? symptoms.join(", ") : "Unspecified symptoms";

  return {
    success: true,
    riskLevel,
    riskColor,
    title: `AI Health Assessment: ${possibleConditions[0] || "General Assessment"}`,
    summary: `Based on reported symptoms (${symptomsFormatted}) lasting ${duration} with ${severity.toLowerCase()} severity, your profile suggests ${possibleConditions.join(" or ")}. ${additionalInfo ? `Note: "${additionalInfo}" was considered in this assessment.` : ""}`,
    possibleConditions,
    suggestedMedicines,
    homeCareAdvice,
    whenToSeeDoctor,
    disclaimer: "⚠️ Disclaimer: Educational AI triage tool. Not professional medical advice."
  };
};

const callGeminiAPI = (apiKey, prompt) => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json"
      }
    });

    const options = {
      hostname: "generativelanguage.googleapis.com",
      port: 443,
      path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsed = JSON.parse(data);
            const textResponse = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textResponse) {
              const jsonResult = JSON.parse(textResponse);
              resolve(jsonResult);
            } else {
              reject(new Error("No candidate text in Gemini response"));
            }
          } catch (e) {
            reject(e);
          }
        } else {
          reject(new Error(`Gemini API HTTP Error ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on("error", (e) => reject(e));
    req.setTimeout(8000, () => {
      req.destroy();
      reject(new Error("Gemini API request timed out"));
    });

    req.write(postData);
    req.end();
  });
};

const analyzeSymptoms = async (req, res) => {
  try {
    const { symptoms = [], duration = "1-2 Days", severity = "Moderate", additionalInfo = "" } = req.body;

    if (!symptoms || symptoms.length === 0) {
      return res.status(400).json({ success: false, message: "Please select at least one symptom for evaluation." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    let evalResult;

    if (apiKey && apiKey !== "YOUR_GEMINI_API_KEY") {
      const prompt = `You are a medical triage AI assistant for MediFind.
User Symptoms: ${symptoms.join(", ")}
Duration: ${duration}
Severity: ${severity}
Additional User Notes: ${additionalInfo || "None"}

Please analyze these symptoms and respond STRICTLY in JSON format matching this schema:
{
  "riskLevel": "Low" | "Moderate" | "High",
  "riskColor": "emerald" | "amber" | "rose",
  "title": "Short title describing the assessment",
  "summary": "Comprehensive professional triage explanation (2-3 sentences)",
  "possibleConditions": ["Condition 1", "Condition 2"],
  "suggestedMedicines": [
    {
      "name": "Generic or Brand Medicine Name (e.g. Paracetamol)",
      "purpose": "Short description of what it relieves",
      "dosageInfo": "Safe dosage guidance"
    }
  ],
  "homeCareAdvice": ["Advice 1", "Advice 2", "Advice 3"],
  "whenToSeeDoctor": "Clear criteria for when urgent care is needed",
  "disclaimer": "⚠️ Disclaimer: Educational AI triage tool. Not professional medical advice."
}`;

      try {
        evalResult = await callGeminiAPI(apiKey, prompt);
      } catch (geminiError) {
        evalResult = generateClinicalFallback(symptoms, duration, severity, additionalInfo);
      }
    } else {
      evalResult = generateClinicalFallback(symptoms, duration, severity, additionalInfo);
    }

    // Strictly cross-reference database: verify which suggested medicines exist in user's MongoDB database
    if (evalResult && evalResult.suggestedMedicines) {
      const checkedMedicines = await Promise.all(
        evalResult.suggestedMedicines.map(async (med) => {
          try {
            const dbMatch = await Medicine.findOne({
              name: { $regex: med.name.trim(), $options: "i" },
              inStock: true
            }).lean();
            return {
              ...med,
              inDatabase: !!dbMatch,
              priceInDb: dbMatch ? dbMatch.price : null
            };
          } catch (dbErr) {
            return {
              ...med,
              inDatabase: false,
              priceInDb: null
            };
          }
        })
      );
      evalResult.suggestedMedicines = checkedMedicines;
    }

    return res.json({
      success: true,
      ...evalResult
    });
  } catch (err) {
    console.error("Error in analyzeSymptoms controller:", err);
    return res.status(500).json({
      success: false,
      message: "An internal server error occurred while analyzing symptoms."
    });
  }
};

module.exports = {
  analyzeSymptoms
};
