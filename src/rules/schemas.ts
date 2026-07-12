import { z } from "zod";

const SA_ID = /^\d{13}$/;
const SA_PHONE = /^(?:\+27|0)[6-8]\d{8}$/;

export const patientSchema = z.object({
  firstName: z.string().trim().min(1, "Required").max(60),
  lastName: z.string().trim().min(1, "Required").max(60),
  idNumber: z.string().trim().regex(SA_ID, "Must be a 13-digit SA ID").or(z.string().min(6, "Passport must be at least 6 chars")),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  gender: z.enum(["M", "F", "X"]),
  scheme: z.string().trim().min(1, "Required"),
  membership: z.string().trim().min(3, "Required"),
  phone: z.string().regex(SA_PHONE, "Enter a valid SA mobile number"),
  email: z.string().email().optional().or(z.literal("")),
  facility: z.string().min(1, "Required"),
});

export type PatientInput = z.infer<typeof patientSchema>;

export const admissionSchema = z.object({
  patientId: z.string().min(1, "Select a patient"),
  admissionType: z.enum(["Elective", "Emergency", "Maternity", "Day Case", "Transfer"]),
  facility: z.string().min(1, "Required"),
  ward: z.string().min(1, "Required"),
  bed: z.string().optional(),
  practitioner: z.string().min(2, "Required"),
  diagnosis: z.string().min(3, "Provisional diagnosis required"),
  scheme: z.string().min(1, "Required"),
  authorisation: z.string().optional(),
  admittedAt: z.string().min(10, "Date/time required"),
  notes: z.string().max(2000).optional(),
});

export type AdmissionInput = z.infer<typeof admissionSchema>;

export const paymentSchema = z.object({
  patientId: z.string().min(1, "Select a patient"),
  accountId: z.string().min(1, "Account required"),
  amount: z.coerce.number().positive("Must be greater than R 0"),
  method: z.enum(["Cash", "EFT", "Card", "Cheque", "Scheme"]),
  reference: z.string().max(60).optional(),
  receivedAt: z.string().min(10, "Date/time required"),
});

export type PaymentInput = z.infer<typeof paymentSchema>;

export const documentUploadSchema = z.object({
  patientId: z.string().min(1, "Select a patient"),
  category: z.enum([
    "Consent",
    "Discharge Summary",
    "Pathology",
    "Radiology",
    "Referral",
    "Invoice",
    "Authorisation",
    "Other",
  ]),
  fileName: z.string().min(1, "File required"),
  sizeBytes: z.number().max(25 * 1024 * 1024, "File must be under 25 MB"),
  mime: z.string().refine(
    (m) => ["application/pdf", "image/png", "image/jpeg", "image/webp"].includes(m),
    "Only PDF, PNG, JPEG or WebP files are allowed",
  ),
});

export type DocumentUploadInput = z.infer<typeof documentUploadSchema>;
