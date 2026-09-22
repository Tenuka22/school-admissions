/**
 * Friendly display labels for the marking scheme's checkbox-group option
 * values (additional supporting documents, leadership roles, other
 * co-curricular activities, sibling exam achievements) - mirrors the source
 * aloysius-g1 project's i18n strings for these exact option ids.
 */
export const CATEGORY_OPTION_LABELS: Record<string, string> = {
  // 6.1 - Additional Supporting Documents
  nic: "NIC",
  "driving-license": "Driving licence",
  "landline-bill": "Landline bill",
  "marriage-certificate": "Marriage certificate",
  "life-insurance-policy": "Life insurance policy",
  "school-leaving-certificate": "School leaving certificate",
  "child-birth-certificate": "Child birth certificate",
  "vehicle-registration": "Vehicle registration",
  "bank-passbook": "Bank passbook",

  // 6.2 - Leadership Roles
  "prefect-primary": "Primary Student Prefect",
  "prefect-junior": "Junior Student Prefect",
  "prefect-senior": "Senior Student Prefect",
  "deputy-head-prefect": "Deputy Head Prefect",
  "head-prefect": "Head Prefect",
  "first-team-vice-captain": "First Team Sports Vice-Captain",
  "first-team-captain": "First Team Sports Captain",

  // 6.2 - Other Activities
  "junior-band-leader": "Junior Band Leader",
  "junior-band-member": "Junior Band Member",
  "senior-band-leader": "Senior Band Leader",
  "senior-band-member": "Senior Band Member",
  "scout-leader": "Scout Leader",
  "scout-member": "Scout Member",
  "cub-scout": "Cub Scout",
  "cadet-team-leader": "Cadet Team Leader",
  "cadet-team-member": "Cadet Team Member",
  "debating-team-leader": "Debating Team Leader",
  "debating-team-member": "Debating Team Member",
  "st-john-ambulance-leader": "St. John Ambulance Leader",
  "st-john-ambulance-member": "St. John Ambulance Member",
  other: "Other",

  // 6.3 - Sibling Exam Achievements
  scholarship: "Grade 5 Scholarship passed (0.5)",
  ol: "G.C.E. (O/L) qualified (1)",
  al: "G.C.E. (A/L) qualified (1.5)",
};
