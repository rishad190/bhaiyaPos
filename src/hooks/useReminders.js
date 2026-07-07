import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { reminderService } from "@/services/reminderService";
import { useToast } from "@/hooks/use-toast";
import logger from "@/utils/logger";

export const reminderKeys = {
  all: ["reminders"],
  lists: () => [...reminderKeys.all, "list"],
  list: () => [...reminderKeys.lists()],
  details: () => [...reminderKeys.all, "detail"],
  detail: (id) => [...reminderKeys.details(), id],
};

// Fetch all reminders
export function useReminders() {
  return useQuery({
    queryKey: reminderKeys.list(),
    queryFn: () => reminderService.getReminders(),
  });
}

// Add reminder hook
export function useAddReminder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (reminderData) => reminderService.addReminder(reminderData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reminderKeys.all });
      toast({
        title: "Success",
        description: "Reminder set successfully",
      });
    },
    onError: (error) => {
      logger.error("[useAddReminder] Error:", error);
      toast({
        title: "Error",
        description: "Failed to set reminder",
        variant: "destructive",
      });
    },
  });
}

// Update reminder hook
export function useUpdateReminder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ reminderId, updatedData }) =>
      reminderService.updateReminder(reminderId, updatedData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: reminderKeys.all });
      toast({
        title: "Success",
        description: "Reminder updated successfully",
      });
    },
    onError: (error) => {
      logger.error("[useUpdateReminder] Error:", error);
      toast({
        title: "Error",
        description: "Failed to update reminder",
        variant: "destructive",
      });
    },
  });
}

// Delete reminder hook
export function useDeleteReminder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (reminderId) => reminderService.deleteReminder(reminderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reminderKeys.all });
      toast({
        title: "Success",
        description: "Reminder deleted successfully",
      });
    },
    onError: (error) => {
      logger.error("[useDeleteReminder] Error:", error);
      toast({
        title: "Error",
        description: "Failed to delete reminder",
        variant: "destructive",
      });
    },
  });
}
