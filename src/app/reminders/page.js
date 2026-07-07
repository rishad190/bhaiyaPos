"use client";
import { useState, useMemo } from "react";
import {
  useReminders,
  useAddReminder,
  useUpdateReminder,
  useDeleteReminder,
} from "@/hooks/useReminders";
import { ReminderDialog } from "@/components/customers/ReminderDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/shared/LoadingState";
import { DataErrorBoundary } from "@/components/shared/ErrorBoundary";
import {
  Plus,
  Search,
  CheckCircle,
  Clock,
  Edit,
  Trash2,
  Phone,
  Calendar,
  AlertCircle,
  TrendingDown,
  DollarSign,
  FileText
} from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import Link from "next/link";

export default function RemindersPage() {
  const { data: reminders = [], isLoading } = useReminders();
  const addReminderMutation = useAddReminder();
  const updateReminderMutation = useUpdateReminder();
  const deleteReminderMutation = useDeleteReminder();

  const [activeTab, setActiveTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState(null);

  // Get current date string in YYYY-MM-DD format
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Filter reminders
  const filteredReminders = useMemo(() => {
    let result = [...reminders];

    // Search filter
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (r) =>
          r.customerName?.toLowerCase().includes(term) ||
          r.customerPhone?.includes(term) ||
          r.title?.toLowerCase().includes(term)
      );
    }

    // Tab filter
    switch (activeTab) {
      case "pending":
        result = result.filter((r) => r.status === "pending");
        break;
      case "completed":
        result = result.filter((r) => r.status === "completed");
        break;
      case "today":
        result = result.filter((r) => r.dueDate === todayStr && r.status === "pending");
        break;
      case "overdue":
        result = result.filter((r) => r.dueDate < todayStr && r.status === "pending");
        break;
      case "check":
        result = result.filter((r) => r.type === "check");
        break;
      case "cash":
        result = result.filter((r) => r.type === "cash");
        break;
      default:
        // 'all'
        break;
    }

    // Sort by due date (ascending for pending/overdue, descending for completed/all)
    result.sort((a, b) => {
      if (a.status === "pending" && b.status === "pending") {
        const dateTimeA = `${a.dueDate}T${a.dueTime}`;
        const dateTimeB = `${b.dueDate}T${b.dueTime}`;
        return dateTimeA.localeCompare(dateTimeB);
      }
      // Otherwise, sort by created date or due date descending
      const getTime = (item) => {
        const dateVal = item.updatedAt || item.createdAt || item.dueDate;
        if (!dateVal) return 0;
        if (typeof dateVal === "number") return dateVal;
        const parsed = Date.parse(dateVal);
        return isNaN(parsed) ? 0 : parsed;
      };
      return getTime(b) - getTime(a);
    });

    return result;
  }, [reminders, activeTab, searchTerm, todayStr]);

  // Summary stats
  const stats = useMemo(() => {
    const total = reminders.length;
    const pending = reminders.filter((r) => r.status === "pending").length;
    const completed = reminders.filter((r) => r.status === "completed").length;
    const overdue = reminders.filter((r) => r.dueDate < todayStr && r.status === "pending").length;
    const checks = reminders.filter((r) => r.type === "check" && r.status === "pending").length;
    const cash = reminders.filter((r) => r.type === "cash" && r.status === "pending").length;

    return { total, pending, completed, overdue, checks, cash };
  }, [reminders, todayStr]);

  const handleAddOrEditReminder = async (formData) => {
    if (selectedReminder) {
      // Edit mode
      await updateReminderMutation.mutateAsync({
        reminderId: selectedReminder.id,
        updatedData: formData,
      });
    } else {
      // Create mode
      await addReminderMutation.mutateAsync(formData);
    }
  };

  const handleStatusChange = async (reminder, isCompleted) => {
    await updateReminderMutation.mutateAsync({
      reminderId: reminder.id,
      updatedData: {
        status: isCompleted ? "completed" : "pending",
      },
    });
  };

  const handleDeleteReminder = async (reminderId) => {
    if (window.confirm("Are you sure you want to delete this reminder?")) {
      await deleteReminderMutation.mutateAsync(reminderId);
    }
  };

  if (isLoading) {
    return (
      <LoadingState
        title="Reminders"
        description="Loading reminders..."
      />
    );
  }

  return (
    <DataErrorBoundary>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 flex items-center gap-2">
              <Calendar className="h-8 w-8 text-primary" />
              Payment Reminders
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Set and manage customer cash or check payment reminders.
            </p>
          </div>
          <Button
            onClick={() => {
              setSelectedReminder(null);
              setDialogOpen(true);
            }}
            className="w-full md:w-auto shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
          >
            <Plus className="h-5 w-5" />
            New Reminder
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-blue-600 uppercase">Pending Reminders</p>
                <h3 className="text-2xl font-bold text-blue-900 mt-1">{stats.pending}</h3>
              </div>
              <Clock className="h-8 w-8 text-blue-500 opacity-80" />
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-gradient-to-br from-red-50 to-pink-50">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-red-600 uppercase">Overdue Reminders</p>
                <h3 className="text-2xl font-bold text-red-900 mt-1">{stats.overdue}</h3>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500 opacity-80" />
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-gradient-to-br from-cyan-50 to-teal-50">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-cyan-600 uppercase">Pending Checks</p>
                <h3 className="text-2xl font-bold text-cyan-900 mt-1">{stats.checks}</h3>
              </div>
              <FileText className="h-8 w-8 text-cyan-500 opacity-80" />
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-50 to-green-50">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-600 uppercase">Pending Cash</p>
                <h3 className="text-2xl font-bold text-emerald-900 mt-1">{stats.cash}</h3>
              </div>
              <DollarSign className="h-8 w-8 text-emerald-500 opacity-80" />
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between pt-2 border-t">
          {/* Tabs Filter */}
          <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
            {[
              { id: "pending", label: "Pending" },
              { id: "overdue", label: "Overdue" },
              { id: "today", label: "Today" },
              { id: "check", label: "Checks" },
              { id: "cash", label: "Cash" },
              { id: "completed", label: "Completed" },
              { id: "all", label: "All" },
            ].map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab(tab.id)}
                className="text-xs md:text-sm rounded-full px-4 h-9"
              >
                {tab.label}
              </Button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-[300px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by customer or note..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Reminders List */}
        {filteredReminders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReminders.map((reminder) => {
              const isOverdue = reminder.dueDate < todayStr && reminder.status === "pending";
              const isToday = reminder.dueDate === todayStr && reminder.status === "pending";
              
              return (
                <Card
                  key={reminder.id}
                  className={`overflow-hidden border transition-all duration-300 hover:scale-[1.01] hover:shadow-md relative ${
                    reminder.status === "completed"
                      ? "bg-gray-50 border-gray-200 opacity-85"
                      : isOverdue
                      ? "border-red-200 bg-red-50/20"
                      : isToday
                      ? "border-amber-200 bg-amber-50/20"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-1">
                        <Link
                          href={`/customers/${reminder.customerId}`}
                          className="font-bold text-lg hover:text-primary transition-colors hover:underline block"
                        >
                          {reminder.customerName}
                        </Link>
                        {reminder.customerPhone && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {reminder.customerPhone}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-1 items-end">
                        <Badge
                          variant={reminder.type === "check" ? "default" : "secondary"}
                          className={`uppercase text-[10px] px-2 py-0.5 ${
                            reminder.type === "check"
                              ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                              : "bg-emerald-600 hover:bg-emerald-700 text-white"
                          }`}
                        >
                          {reminder.type === "check" ? "Check" : "Cash"}
                        </Badge>

                        {reminder.status === "completed" ? (
                          <Badge className="bg-green-100 text-green-700 border-none text-[10px] px-2 py-0.5">
                            Completed
                          </Badge>
                        ) : isOverdue ? (
                          <Badge variant="destructive" className="text-[10px] px-2 py-0.5 animate-pulse">
                            Overdue
                          </Badge>
                        ) : isToday ? (
                          <Badge className="bg-amber-100 text-amber-700 border-none text-[10px] px-2 py-0.5">
                            Today
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-100 text-blue-700 border-none text-[10px] px-2 py-0.5">
                            Pending
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 pt-2 pb-3 space-y-3">
                    {/* Amount & Time info */}
                    <div className="flex items-center justify-between bg-muted/40 p-2.5 rounded-md text-sm border">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold">Amount</span>
                        <span className="font-bold text-foreground">
                          {reminder.amount ? formatCurrency(reminder.amount) : "৳0"}
                        </span>
                      </div>

                      <div className="flex flex-col text-right">
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold">Due Date/Time</span>
                        <span className="font-medium text-foreground flex items-center gap-1 justify-end">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {formatDate(reminder.dueDate)} ({reminder.dueTime})
                        </span>
                      </div>
                    </div>

                    {/* Note Details */}
                    <div className="text-sm border-l-2 border-primary/50 pl-2 text-gray-700 min-h-[40px] flex items-center bg-gray-50/50 py-1.5 rounded-r">
                      <p className="line-clamp-2 italic">{reminder.title}</p>
                    </div>

                    {/* Action Panel */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t">
                      {/* Checkbox status update */}
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium select-none">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          checked={reminder.status === "completed"}
                          onChange={(e) => handleStatusChange(reminder, e.target.checked)}
                        />
                        {reminder.status === "completed" ? "Completed" : "Complete"}
                      </label>

                      {/* Control buttons */}
                      <div className="flex items-center gap-1">
                        {reminder.customerPhone && (
                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                            title="Call customer"
                          >
                            <a href={`tel:${reminder.customerPhone}`}>
                              <Phone className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => {
                            setSelectedReminder(reminder);
                            setDialogOpen(true);
                          }}
                          title="Edit reminder"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteReminder(reminder.id)}
                          title="Delete reminder"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-dashed p-8 text-center bg-gray-50/50">
            <CardContent className="flex flex-col items-center justify-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">No reminders found!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  There are no payment reminders under this category.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedReminder(null);
                  setDialogOpen(true);
                }}
                className="mt-2"
              >
                Create Reminder
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Dialog for adding/editing reminders */}
        <ReminderDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          reminder={selectedReminder}
          onSubmitReminder={handleAddOrEditReminder}
        />
      </div>
    </DataErrorBoundary>
  );
}
