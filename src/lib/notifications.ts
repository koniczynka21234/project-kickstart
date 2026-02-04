import { supabase } from "@/integrations/supabase/client";

interface CreateNotificationParams {
  userId: string;
  title: string;
  content?: string;
  type?: string;
  referenceType?: string;
  referenceId?: string;
  createdBy?: string;
}

export async function createNotification({
  userId,
  title,
  content,
  type = 'info',
  referenceType,
  referenceId,
  createdBy,
}: CreateNotificationParams) {
  try {
    const { error } = await supabase.from('notifications').insert({
      user_id: userId,
      title,
      content: content || null,
      type,
      reference_type: referenceType || null,
      reference_id: referenceId || null,
      created_by: createdBy || null,
    });

    if (error) {
      console.error('Error creating notification:', error);
    }
  } catch (err) {
    console.error('Unexpected error creating notification:', err);
  }
}

// Parse mentions from text and create notifications
export async function processMentions(
  text: string,
  profiles: { id: string; full_name: string | null; email: string | null }[],
  createdBy: string,
  context: string,
  referenceType?: string,
  referenceId?: string
) {
  const mentionRegex = /@(\w+)/g;
  const mentions = text.match(mentionRegex);
  
  if (!mentions) return;

  const mentionedNames = mentions.map(m => m.slice(1).toLowerCase());
  
  for (const profile of profiles) {
    const name = (profile.full_name || profile.email || '').toLowerCase().split(' ')[0];
    if (mentionedNames.some(m => name.includes(m) || m.includes(name))) {
      if (profile.id !== createdBy) {
        await createNotification({
          userId: profile.id,
          title: `Wspomniano Cię w ${context}`,
          content: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
          type: 'mention',
          referenceType,
          referenceId,
          createdBy,
        });
      }
    }
  }
}

// Notification for task completion
export async function notifyTaskCompleted(
  taskId: string,
  taskTitle: string,
  completedBy: string,
  completedByName: string,
  taskCreatorId: string | null,
  taskAssignedTo: string | null
) {
  const notifyUsers = new Set<string>();
  
  if (taskCreatorId && taskCreatorId !== completedBy) {
    notifyUsers.add(taskCreatorId);
  }
  if (taskAssignedTo && taskAssignedTo !== completedBy && taskAssignedTo !== taskCreatorId) {
    notifyUsers.add(taskAssignedTo);
  }

  for (const userId of notifyUsers) {
    await createNotification({
      userId,
      title: 'Zadanie ukończone',
      content: `${completedByName} ukończył(a) zadanie "${taskTitle}"`,
      type: 'task_completed',
      referenceType: 'task',
      referenceId: taskId,
      createdBy: completedBy,
    });
  }
}

// Notification for task assignment
export async function notifyTaskAssigned(
  taskId: string,
  taskTitle: string,
  assignedToId: string,
  assignedByName: string,
  assignedById: string
) {
  if (assignedToId === assignedById) return;

  await createNotification({
    userId: assignedToId,
    title: 'Nowe zadanie',
    content: `${assignedByName} przypisał(a) Ci zadanie "${taskTitle}"`,
    type: 'task_assigned',
    referenceType: 'task',
    referenceId: taskId,
    createdBy: assignedById,
  });
}

// Notification for client guardian assignment
export async function notifyGuardianAssigned(
  clientId: string,
  clientName: string,
  guardianId: string,
  assignedByName: string,
  assignedById: string
) {
  if (guardianId === assignedById) return;

  await createNotification({
    userId: guardianId,
    title: 'Przypisano klienta',
    content: `${assignedByName} przypisał(a) Ci klienta "${clientName}"`,
    type: 'client_assigned',
    referenceType: 'client',
    referenceId: clientId,
    createdBy: assignedById,
  });
}

// Notification for upcoming final invoice
export async function notifyFinalInvoiceDue(
  clientId: string,
  clientName: string,
  remainingAmount: number,
  expectedDate: string,
  daysRemaining: number,
  teamUserIds: string[]
) {
  const formattedAmount = new Intl.NumberFormat('pl-PL', { 
    style: 'currency', 
    currency: 'PLN',
    maximumFractionDigits: 0
  }).format(remainingAmount);

  const urgencyText = daysRemaining <= 0 
    ? 'DZIŚ!' 
    : daysRemaining === 1 
      ? 'jutro' 
      : `za ${daysRemaining} dni`;

  for (const userId of teamUserIds) {
    await createNotification({
      userId,
      title: `Faktura końcowa - termin ${urgencyText}`,
      content: `Klient "${clientName}" - pozostało do wystawienia: ${formattedAmount}`,
      type: 'final_invoice_due',
      referenceType: 'client',
      referenceId: clientId,
    });
  }
}

// Lead source options
export const leadSourceOptions = [
  'Instagram',
  'Facebook',
  'Cold mail',
  'Cold call',
  'Polecenie',
  'Google',
  'Strona www',
  'Inne',
];
