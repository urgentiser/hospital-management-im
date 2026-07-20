import type { CurrentStateModuleSummary } from "@/current-state/types";

export const currentStateModules = [
  {
    "key": "patient-maintenance",
    "code": "01",
    "name": "Patient Maintenance",
    "category": "Patient Care",
    "connectedApplication": false,
    "counts": {
      "menus": 3,
      "workflows": 3,
      "rules": 58,
      "validations": 15,
      "tests": 23,
      "models": 273,
      "properties": 1574,
      "services": 68,
      "tables": 61,
      "events": 10
    }
  },
  {
    "key": "triage",
    "code": "02",
    "name": "Triage",
    "category": "Patient Care",
    "connectedApplication": false,
    "counts": {
      "menus": 2,
      "workflows": 2,
      "rules": 76,
      "validations": 13,
      "tests": 0,
      "models": 89,
      "properties": 1031,
      "services": 35,
      "tables": 13,
      "events": 2
    }
  },
  {
    "key": "clinical-assessment",
    "code": "03",
    "name": "Clinical Assessment",
    "category": "Patient Care",
    "connectedApplication": false,
    "counts": {
      "menus": 2,
      "workflows": 2,
      "rules": 198,
      "validations": 30,
      "tests": 11,
      "models": 60,
      "properties": 400,
      "services": 46,
      "tables": 25,
      "events": 6
    }
  },
  {
    "key": "preadmission",
    "code": "04",
    "name": "Preadmission",
    "category": "Patient Care",
    "connectedApplication": false,
    "counts": {
      "menus": 9,
      "workflows": 6,
      "rules": 64,
      "validations": 18,
      "tests": 42,
      "models": 98,
      "properties": 979,
      "services": 110,
      "tables": 16,
      "events": 25
    }
  },
  {
    "key": "admissions",
    "code": "05",
    "name": "Admissions",
    "category": "Patient Care",
    "connectedApplication": false,
    "counts": {
      "menus": 25,
      "workflows": 19,
      "rules": 357,
      "validations": 102,
      "tests": 134,
      "models": 212,
      "properties": 2287,
      "services": 269,
      "tables": 51,
      "events": 33
    }
  },
  {
    "key": "authorisations",
    "code": "06",
    "name": "Authorisations",
    "category": "Patient Care",
    "connectedApplication": false,
    "counts": {
      "menus": 17,
      "workflows": 15,
      "rules": 34,
      "validations": 22,
      "tests": 26,
      "models": 97,
      "properties": 810,
      "services": 218,
      "tables": 281,
      "events": 57
    }
  },
  {
    "key": "medical-events",
    "code": "07",
    "name": "Medical Events",
    "category": "Patient Care",
    "connectedApplication": false,
    "counts": {
      "menus": 7,
      "workflows": 0,
      "rules": 0,
      "validations": 0,
      "tests": 3,
      "models": 76,
      "properties": 256,
      "services": 25,
      "tables": 16,
      "events": 74
    }
  },
  {
    "key": "pharmacy",
    "code": "08",
    "name": "Pharmacy",
    "category": "Clinical Operations",
    "connectedApplication": false,
    "counts": {
      "menus": 24,
      "workflows": 24,
      "rules": 64,
      "validations": 137,
      "tests": 104,
      "models": 132,
      "properties": 1245,
      "services": 122,
      "tables": 0,
      "events": 39
    }
  },
  {
    "key": "theatre-management",
    "code": "09",
    "name": "Theatre Management",
    "category": "Clinical Operations",
    "connectedApplication": false,
    "counts": {
      "menus": 8,
      "workflows": 7,
      "rules": 89,
      "validations": 42,
      "tests": 221,
      "models": 253,
      "properties": 1196,
      "services": 173,
      "tables": 92,
      "events": 232
    }
  },
  {
    "key": "ward-management",
    "code": "10",
    "name": "Ward Management",
    "category": "Clinical Operations",
    "connectedApplication": false,
    "counts": {
      "menus": 9,
      "workflows": 10,
      "rules": 67,
      "validations": 76,
      "tests": 100,
      "models": 127,
      "properties": 821,
      "services": 98,
      "tables": 8,
      "events": 128
    }
  },
  {
    "key": "facilities",
    "code": "11",
    "name": "Facilities",
    "category": "Clinical Operations",
    "connectedApplication": false,
    "counts": {
      "menus": 0,
      "workflows": 0,
      "rules": 0,
      "validations": 0,
      "tests": 17,
      "models": 41,
      "properties": 197,
      "services": 54,
      "tables": 27,
      "events": 0
    }
  },
  {
    "key": "practitioners",
    "code": "12",
    "name": "Practitioners",
    "category": "Clinical Operations",
    "connectedApplication": false,
    "counts": {
      "menus": 2,
      "workflows": 2,
      "rules": 1,
      "validations": 0,
      "tests": 33,
      "models": 70,
      "properties": 424,
      "services": 41,
      "tables": 75,
      "events": 0
    }
  },
  {
    "key": "case-management",
    "code": "13",
    "name": "Case Management",
    "category": "Clinical Operations",
    "connectedApplication": false,
    "counts": {
      "menus": 14,
      "workflows": 15,
      "rules": 70,
      "validations": 57,
      "tests": 68,
      "models": 242,
      "properties": 2203,
      "services": 226,
      "tables": 92,
      "events": 265
    }
  },
  {
    "key": "clinical-coding",
    "code": "14",
    "name": "Clinical Coding",
    "category": "Clinical Operations",
    "connectedApplication": false,
    "counts": {
      "menus": 10,
      "workflows": 10,
      "rules": 60,
      "validations": 17,
      "tests": 12,
      "models": 85,
      "properties": 382,
      "services": 13,
      "tables": 35,
      "events": 2
    }
  },
  {
    "key": "billing",
    "code": "15",
    "name": "Billing",
    "category": "Funding & Revenue",
    "connectedApplication": false,
    "counts": {
      "menus": 4,
      "workflows": 4,
      "rules": 5,
      "validations": 3,
      "tests": 5,
      "models": 60,
      "properties": 879,
      "services": 31,
      "tables": 0,
      "events": 16
    }
  },
  {
    "key": "funding",
    "code": "16",
    "name": "Funding",
    "category": "Funding & Revenue",
    "connectedApplication": false,
    "counts": {
      "menus": 10,
      "workflows": 9,
      "rules": 11,
      "validations": 18,
      "tests": 41,
      "models": 145,
      "properties": 765,
      "services": 168,
      "tables": 80,
      "events": 4
    }
  },
  {
    "key": "accounting",
    "code": "17",
    "name": "Accounting",
    "category": "Funding & Revenue",
    "connectedApplication": false,
    "counts": {
      "menus": 9,
      "workflows": 9,
      "rules": 2,
      "validations": 0,
      "tests": 4,
      "models": 52,
      "properties": 481,
      "services": 45,
      "tables": 8,
      "events": 1
    }
  },
  {
    "key": "reimbursements",
    "code": "18",
    "name": "Reimbursements",
    "category": "Funding & Revenue",
    "connectedApplication": false,
    "counts": {
      "menus": 1,
      "workflows": 1,
      "rules": 1,
      "validations": 1,
      "tests": 12,
      "models": 24,
      "properties": 148,
      "services": 12,
      "tables": 11,
      "events": 0
    }
  },
  {
    "key": "coid",
    "code": "19",
    "name": "COID",
    "category": "Funding & Revenue",
    "connectedApplication": false,
    "counts": {
      "menus": 1,
      "workflows": 1,
      "rules": 14,
      "validations": 5,
      "tests": 18,
      "models": 29,
      "properties": 192,
      "services": 33,
      "tables": 16,
      "events": 12
    }
  },
  {
    "key": "adhoc-and-supplier-invoices",
    "code": "20",
    "name": "AdHoc and Supplier Invoices",
    "category": "Funding & Revenue",
    "connectedApplication": false,
    "counts": {
      "menus": 3,
      "workflows": 3,
      "rules": 9,
      "validations": 1,
      "tests": 24,
      "models": 25,
      "properties": 154,
      "services": 23,
      "tables": 24,
      "events": 16
    }
  },
  {
    "key": "documents-and-printing",
    "code": "21",
    "name": "Documents and Printing",
    "category": "Platform & Administration",
    "connectedApplication": false,
    "counts": {
      "menus": 0,
      "workflows": 0,
      "rules": 0,
      "validations": 0,
      "tests": 0,
      "models": 0,
      "properties": 0,
      "services": 0,
      "tables": 0,
      "events": 0
    }
  },
  {
    "key": "workflow-inbox",
    "code": "22",
    "name": "Workflow Inbox",
    "category": "Platform & Administration",
    "connectedApplication": false,
    "counts": {
      "menus": 1,
      "workflows": 1,
      "rules": 0,
      "validations": 0,
      "tests": 0,
      "models": 0,
      "properties": 0,
      "services": 0,
      "tables": 0,
      "events": 1
    }
  },
  {
    "key": "mylife-portal",
    "code": "23",
    "name": "MyLife Portal",
    "category": "Platform & Administration",
    "connectedApplication": false,
    "counts": {
      "menus": 2,
      "workflows": 2,
      "rules": 0,
      "validations": 0,
      "tests": 32,
      "models": 18,
      "properties": 192,
      "services": 24,
      "tables": 14,
      "events": 0
    }
  },
  {
    "key": "integrations-and-support",
    "code": "24",
    "name": "Integrations and Support",
    "category": "Platform & Administration",
    "connectedApplication": false,
    "counts": {
      "menus": 6,
      "workflows": 6,
      "rules": 5,
      "validations": 9,
      "tests": 132,
      "models": 346,
      "properties": 2105,
      "services": 67,
      "tables": 1,
      "events": 102
    }
  },
  {
    "key": "audit-trail",
    "code": "25",
    "name": "Audit Trail",
    "category": "Platform & Administration",
    "connectedApplication": false,
    "counts": {
      "menus": 0,
      "workflows": 0,
      "rules": 0,
      "validations": 0,
      "tests": 5,
      "models": 8,
      "properties": 37,
      "services": 52,
      "tables": 4,
      "events": 46
    }
  },
  {
    "key": "administration",
    "code": "26",
    "name": "Administration",
    "category": "Platform & Administration",
    "connectedApplication": false,
    "counts": {
      "menus": 32,
      "workflows": 29,
      "rules": 29,
      "validations": 28,
      "tests": 27,
      "models": 67,
      "properties": 397,
      "services": 136,
      "tables": 39,
      "events": 5
    }
  },
  {
    "key": "multitouch-census",
    "code": "27",
    "name": "MultiTouch Census",
    "category": "MultiTouch Applications",
    "connectedApplication": true,
    "counts": {
      "menus": 0,
      "workflows": 0,
      "rules": 17,
      "validations": 19,
      "tests": 35,
      "models": 36,
      "properties": 156,
      "services": 22,
      "tables": 0,
      "events": 1
    }
  },
  {
    "key": "multitouch-theatre",
    "code": "28",
    "name": "MultiTouch Theatre",
    "category": "MultiTouch Applications",
    "connectedApplication": true,
    "counts": {
      "menus": 7,
      "workflows": 7,
      "rules": 89,
      "validations": 42,
      "tests": 182,
      "models": 185,
      "properties": 854,
      "services": 121,
      "tables": 0,
      "events": 135
    }
  },
  {
    "key": "multitouch-ward",
    "code": "29",
    "name": "MultiTouch Ward",
    "category": "MultiTouch Applications",
    "connectedApplication": true,
    "counts": {
      "menus": 7,
      "workflows": 7,
      "rules": 67,
      "validations": 76,
      "tests": 89,
      "models": 111,
      "properties": 709,
      "services": 75,
      "tables": 0,
      "events": 87
    }
  },
  {
    "key": "multitouch-event-and-user-registration",
    "code": "30",
    "name": "MultiTouch Event and User Registration",
    "category": "MultiTouch Applications",
    "connectedApplication": true,
    "counts": {
      "menus": 0,
      "workflows": 0,
      "rules": 3,
      "validations": 0,
      "tests": 5,
      "models": 19,
      "properties": 19,
      "services": 5,
      "tables": 0,
      "events": 3
    }
  },
  {
    "key": "product-catalogue-pcms",
    "code": "31",
    "name": "Product Catalogue / PCMS",
    "category": "Catalogue Applications",
    "connectedApplication": true,
    "counts": {
      "menus": 0,
      "workflows": 0,
      "rules": 12,
      "validations": 11,
      "tests": 125,
      "models": 103,
      "properties": 454,
      "services": 74,
      "tables": 304,
      "events": 0
    }
  },
  {
    "key": "charges-catalogue",
    "code": "32",
    "name": "Charges Catalogue",
    "category": "Catalogue Applications",
    "connectedApplication": true,
    "counts": {
      "menus": 0,
      "workflows": 0,
      "rules": 3,
      "validations": 3,
      "tests": 59,
      "models": 86,
      "properties": 411,
      "services": 55,
      "tables": 0,
      "events": 1
    }
  },
  {
    "key": "funder-catalogue",
    "code": "33",
    "name": "Funder Catalogue",
    "category": "Catalogue Applications",
    "connectedApplication": true,
    "counts": {
      "menus": 0,
      "workflows": 0,
      "rules": 3,
      "validations": 2,
      "tests": 16,
      "models": 0,
      "properties": 0,
      "services": 0,
      "tables": 0,
      "events": 0
    }
  },
  {
    "key": "reimbursements-catalogue",
    "code": "34",
    "name": "Reimbursements Catalogue",
    "category": "Catalogue Applications",
    "connectedApplication": true,
    "counts": {
      "menus": 0,
      "workflows": 0,
      "rules": 3,
      "validations": 2,
      "tests": 6,
      "models": 11,
      "properties": 39,
      "services": 7,
      "tables": 0,
      "events": 0
    }
  },
  {
    "key": "nonconsumables-catalogue",
    "code": "35",
    "name": "Non-Consumables Catalogue",
    "category": "Catalogue Applications",
    "connectedApplication": true,
    "counts": {
      "menus": 0,
      "workflows": 0,
      "rules": 4,
      "validations": 2,
      "tests": 0,
      "models": 0,
      "properties": 0,
      "services": 0,
      "tables": 0,
      "events": 0
    }
  },
  {
    "key": "vivo-security",
    "code": "36",
    "name": "Vivo Security",
    "category": "Security",
    "connectedApplication": true,
    "counts": {
      "menus": 0,
      "workflows": 0,
      "rules": 1,
      "validations": 0,
      "tests": 8,
      "models": 3,
      "properties": 17,
      "services": 4,
      "tables": 0,
      "events": 0
    }
  },
  {
    "key": "member-validation",
    "code": "37",
    "name": "Member Validation",
    "category": "Patient Care",
    "connectedApplication": false,
    "counts": {
      "menus": 5,
      "workflows": 5,
      "rules": 18,
      "validations": 86,
      "tests": 0,
      "models": 110,
      "properties": 1099,
      "services": 69,
      "tables": 77,
      "events": 3
    }
  }
] as const satisfies readonly CurrentStateModuleSummary[];

const aliases: Record<string, string> = {
  "member-validation": "member-validation",
  "member validation": "member-validation",
  "eligibility": "member-validation",
  "patients": "patient-maintenance",
  "patient": "patient-maintenance",
  "patient maintenance": "patient-maintenance",
  "triage": "triage",
  "clinical-assessments": "clinical-assessment",
  "clinical assessment": "clinical-assessment",
  "preadmissions": "preadmission",
  "preadmission": "preadmission",
  "admissions": "admissions",
  "admission": "admissions",
  "authorisations": "authorisations",
  "authorizations": "authorisations",
  "medical-events": "medical-events",
  "medical events": "medical-events",
  "pharmacy": "pharmacy",
  "theatre": "theatre-management",
  "theatre management": "theatre-management",
  "ward": "ward-management",
  "ward management": "ward-management",
  "facilities": "facilities",
  "practitioners": "practitioners",
  "case-management": "case-management",
  "case management": "case-management",
  "clinical-coding": "clinical-coding",
  "clinical coding": "clinical-coding",
  "billing": "billing",
  "funding": "funding",
  "accounting": "accounting",
  "reimbursements": "reimbursements",
  "coid": "coid",
  "adhoc": "adhoc-and-supplier-invoices",
  "supplier-invoices": "adhoc-and-supplier-invoices",
  "documents": "documents-and-printing",
  "printing": "documents-and-printing",
  "workflow-inbox": "workflow-inbox",
  "mylife-portal": "mylife-portal",
  "integrations": "integrations-and-support",
  "service-bus": "integrations-and-support",
  "failed-messages": "integrations-and-support",
  "system-health": "integrations-and-support",
  "services": "integrations-and-support",
  "notifications": "integrations-and-support",
  "audit": "audit-trail",
  "audit trail": "audit-trail",
  "admin": "administration",
  "administration": "administration",
  "reports": "audit-trail",
  "multitouch-census": "multitouch-census",
  "multitouch-theatre": "multitouch-theatre",
  "multitouch-ward": "multitouch-ward",
  "multitouch-registration": "multitouch-event-and-user-registration",
  "pcms": "product-catalogue-pcms",
  "product-catalogue": "product-catalogue-pcms",
  "charges-catalogue": "charges-catalogue",
  "funder-catalogue": "funder-catalogue",
  "reimbursements-catalogue": "reimbursements-catalogue",
  "nonconsumables-catalogue": "nonconsumables-catalogue",
  "vivo-security": "vivo-security"
};

export function resolveCurrentStateModuleKey(value: string): string | null {
  const normalised = value.trim().toLowerCase().replace(/^\//, "").replace(/_/g, "-");
  const direct = currentStateModules.find((module) => module.key === normalised);
  if (direct) return direct.key;
  const named = currentStateModules.find((module) => module.name.toLowerCase() === normalised);
  return named?.key ?? aliases[normalised] ?? null;
}

export function getCurrentStateModuleSummary(value: string): CurrentStateModuleSummary | null {
  const key = resolveCurrentStateModuleKey(value);
  return key ? currentStateModules.find((module) => module.key === key) ?? null : null;
}
