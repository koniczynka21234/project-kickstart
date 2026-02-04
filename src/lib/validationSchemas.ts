import { z } from 'zod';

// Client validation schema
export const clientSchema = z.object({
  salon_name: z.string().min(1, 'Nazwa salonu jest wymagana').max(200, 'Nazwa salonu jest za długa'),
  owner_name: z.string().max(100, 'Imię właściciela jest za długie').optional().nullable(),
  city: z.string().max(100, 'Nazwa miasta jest za długa').optional().nullable(),
  phone: z.string().max(20, 'Numer telefonu jest za długi').regex(/^[\d\s\+\-\(\)]*$/, 'Nieprawidłowy format telefonu').optional().nullable().or(z.literal('')),
  email: z.string().email('Nieprawidłowy format email').max(255, 'Email jest za długi').optional().nullable().or(z.literal('')),
  instagram: z.string().max(100, 'Instagram jest za długi').optional().nullable(),
  facebook_page: z.string().url('Nieprawidłowy URL').max(500, 'URL jest za długi').optional().nullable().or(z.literal('')),
  business_manager_url: z.string().url('Nieprawidłowy URL').max(500, 'URL jest za długi').optional().nullable().or(z.literal('')),
  status: z.enum(['active', 'paused', 'churned']),
  contract_start_date: z.string().optional().nullable(),
  monthly_budget: z.string().optional().nullable(),
  notes: z.string().max(2000, 'Notatki są za długie').optional().nullable(),
  assigned_to: z.string().optional().nullable(),
  industry: z.string().max(100).optional().nullable(),
});

export type ClientFormData = z.infer<typeof clientSchema>;

// Lead validation schema
export const leadSchema = z.object({
  salon_name: z.string().min(1, 'Nazwa salonu jest wymagana').max(200, 'Nazwa salonu jest za długa'),
  owner_name: z.string().max(100, 'Imię właściciela jest za długie').optional().nullable(),
  city: z.string().max(100, 'Nazwa miasta jest za długa').optional().nullable(),
  phone: z.string().max(20, 'Numer telefonu jest za długi').regex(/^[\d\s\+\-\(\)]*$/, 'Nieprawidłowy format telefonu').optional().nullable().or(z.literal('')),
  email: z.string().email('Nieprawidłowy format email').max(255, 'Email jest za długi').optional().nullable().or(z.literal('')),
  instagram: z.string().max(100, 'Instagram jest za długi').optional().nullable(),
  facebook_page: z.string().url('Nieprawidłowy URL').max(500, 'URL jest za długi').optional().nullable().or(z.literal('')),
  source: z.string().max(100).optional().nullable(),
  status: z.enum(['new', 'contacted', 'follow_up', 'rozmowa', 'no_response', 'converted', 'lost']),
  notes: z.string().max(2000, 'Notatki są za długie').optional().nullable(),
  cold_email_sent: z.boolean().optional(),
  cold_email_date: z.string().optional().nullable(),
  priority: z.enum(['low', 'medium', 'high']),
  response: z.string().max(2000).optional().nullable(),
  response_date: z.string().optional().nullable(),
  email_template: z.string().max(200).optional().nullable(),
  email_from: z.string().max(255).optional().nullable(),
  industry: z.string().max(100).optional().nullable(),
  sms_follow_up_sent: z.boolean().optional(),
  sms_follow_up_date: z.string().optional().nullable(),
  email_follow_up_1_sent: z.boolean().optional(),
  email_follow_up_1_date: z.string().optional().nullable(),
  email_follow_up_2_sent: z.boolean().optional(),
  email_follow_up_2_date: z.string().optional().nullable(),
});

export type LeadFormData = z.infer<typeof leadSchema>;

// Campaign validation schema
export const campaignSchema = z.object({
  client_id: z.string().min(1, 'Wybierz klienta'),
  name: z.string().min(1, 'Nazwa kampanii jest wymagana').max(200, 'Nazwa kampanii jest za długa'),
  status: z.enum(['active', 'paused', 'completed', 'draft']),
  budget: z.string().optional().nullable(),
  start_date: z.string().min(1, 'Data rozpoczęcia jest wymagana'),
  end_date: z.string().optional().nullable(),
  objective: z.string().max(500, 'Cel kampanii jest za długi').optional().nullable(),
  notes: z.string().max(2000, 'Notatki są za długie').optional().nullable(),
});

export type CampaignFormData = z.infer<typeof campaignSchema>;

// Task validation schema
export const taskSchema = z.object({
  title: z.string().min(1, 'Tytuł zadania jest wymagany').max(200, 'Tytuł zadania jest za długi'),
  description: z.string().max(2000, 'Opis jest za długi').optional().nullable(),
  status: z.enum(['todo', 'in_progress', 'completed']),
  priority: z.enum(['low', 'medium', 'high']),
  due_date: z.string().optional().nullable(),
  assigned_to: z.string().optional().nullable(),
  is_agency_task: z.boolean(),
  client_id: z.string().optional().nullable(),
});

export type TaskFormData = z.infer<typeof taskSchema>;

// Email template validation schema
export const emailTemplateSchema = z.object({
  template_name: z.string().min(1, 'Nazwa szablonu jest wymagana').max(100, 'Nazwa szablonu jest za długa'),
  subject: z.string().min(1, 'Temat jest wymagany').max(200, 'Temat jest za długi'),
  body: z.string().min(1, 'Treść jest wymagana').max(10000, 'Treść jest za długa'),
});

export type EmailTemplateFormData = z.infer<typeof emailTemplateSchema>;

// Campaign metrics validation schema
export const campaignMetricsSchema = z.object({
  period_start: z.string().min(1, 'Data rozpoczęcia jest wymagana'),
  period_end: z.string().min(1, 'Data zakończenia jest wymagana'),
  impressions: z.string().optional(),
  reach: z.string().optional(),
  clicks: z.string().optional(),
  spend: z.string().optional(),
  conversions: z.string().optional(),
  bookings: z.string().optional(),
  messages: z.string().optional(),
});

export type CampaignMetricsFormData = z.infer<typeof campaignMetricsSchema>;

// Validation helper to clean form data before submission
export function cleanFormData<T extends Record<string, any>>(data: T): T {
  const cleaned = { ...data };
  for (const key in cleaned) {
    if (cleaned[key] === '') {
      cleaned[key] = null as any;
    }
  }
  return cleaned;
}
