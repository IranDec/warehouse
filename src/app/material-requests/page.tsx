
// src/app/material-requests/page.tsx
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { PageHeader } from "@/components/common/page-header";
import { DataTable } from "@/components/common/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ClipboardList, PlusCircle, Filter, MoreHorizontal, CheckCircle, XCircle, 
  Edit, Ban, Hourglass, ThumbsUp, ThumbsDown, CircleSlash, PackageCheck 
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { useAuth } from '@/contexts/auth-context';
import type { MaterialRequest, MaterialRequestStatus, RequestedItem } from '@/lib/types';
import { MATERIAL_REQUEST_STATUS_OPTIONS, ALL_FILTER_VALUE } from '@/lib/constants';
import { NewMaterialRequestModal } from '@/components/material-requests/new-request-modal';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DateRangePicker } from '@/components/common/date-range-picker';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { DateRange } from 'react-day-picker';
import { startOfDay, endOfDay, isWithinInterval, parseISO } from 'date-fns';
import { cn } from "@/lib/utils";
import { ClientSideFormattedDate } from '@/components/common/client-side-formatted-date';


interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  colorClass?: string;
}

const StatDisplayCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, colorClass }) => (
  <Card className={cn("shadow-sm", colorClass)}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-5 w-5 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);


export default function MaterialRequestsPage() {
  const { currentUser, materialRequests, addMaterialRequest, updateMaterialRequest: contextUpdateMaterialRequest, users: authUsers } = useAuth();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<MaterialRequest | null>(null);
  
  const [filterStatus, setFilterStatus] = useState<string>(ALL_FILTER_VALUE);
  const [filterRequester, setFilterRequester] = useState<string>(ALL_FILTER_VALUE);
  const [filterDepartment, setFilterDepartment] = useState<string>(ALL_FILTER_VALUE);
  const [filterSubmissionDate, setFilterSubmissionDate] = useState<DateRange | undefined>(undefined);

  const [showCancelConfirm, setShowCancelConfirm] = useState<MaterialRequest | null>(null);

  const canCreateRequests = currentUser?.role === 'DepartmentEmployee';
  const canManageRequests = currentUser?.role === 'Admin' || currentUser?.role === 'WarehouseManager';

  const pageDescription = useMemo(() => {
    if (canManageRequests) {
      return "Review, approve, or reject material requests. Track status using filters.";
    }
    if (canCreateRequests) {
      return "Submit new requests, view, edit (if pending), or cancel your requests.";
    }
    return "View material requests. Contact an administrator for more permissions.";
  }, [canManageRequests, canCreateRequests]);

  const uniqueRequesters = useMemo(() => {
    // Use authUsers for consistent list of possible requesters if available
    if (authUsers && authUsers.length > 0) {
        return authUsers.filter(u => u.role === 'DepartmentEmployee' || materialRequests.some(r => r.requesterId === u.id)).map(u => u.name).sort();
    }
    const requesters = new Set(materialRequests.map(r => r.requesterName));
    return Array.from(requesters).sort();
  }, [materialRequests, authUsers]); 

  const uniqueDepartments = useMemo(() => {
    const departments = new Set(materialRequests.map(r => r.departmentCategory));
    return Array.from(departments).sort();
  }, [materialRequests]); 

  const handleAddNewRequestFromPage = (newRequestData: Omit<MaterialRequest, 'id' | 'submissionDate' | 'status' | 'requesterId' | 'requesterName' | 'departmentCategory'>) => {
    addMaterialRequest(newRequestData); 
  };

  const handleUpdateRequest = (updatedRequest: MaterialRequest) => {
    contextUpdateMaterialRequest(updatedRequest); 
  }

  const handleAction = (requestId: string, newStatus: MaterialRequestStatus, notes?: string) => {
    if (!currentUser) return;

    const requestToUpdate = materialRequests.find(r => r.id === requestId);
    if (!requestToUpdate) {
        toast({ title: "Error", description: "Request not found.", variant: "destructive"});
        return;
    }
    
    const isManagerAction = (newStatus === 'Approved' || newStatus === 'Rejected') && canManageRequests;
    const isRequesterAction = newStatus === 'Cancelled' && requestToUpdate.requesterId === currentUser.id && requestToUpdate.status === 'Pending';

    if (!isManagerAction && !isRequesterAction) {
        toast({ title: "Permission Denied", description: "You do not have permission to perform this action.", variant: "destructive"});
        return;
    }

    const updatedReq = {
        ...requestToUpdate,
        status: newStatus,
        approverId: isManagerAction ? currentUser.id : requestToUpdate.approverId,
        approverName: isManagerAction ? currentUser.name : requestToUpdate.approverName,
        actionDate: new Date().toISOString(),
        approverNotes: notes || requestToUpdate.approverNotes,
    };
    contextUpdateMaterialRequest(updatedReq);

    toast({ title: `Request ${newStatus}`, description: `Request ${requestId} has been ${newStatus.toLowerCase()}.` });
    if (showCancelConfirm?.id === requestId) {
      setShowCancelConfirm(null);
    }
  };

  const filteredRequests = useMemo(() => {
    return materialRequests.filter(request => {
      const statusMatch = filterStatus === ALL_FILTER_VALUE ? true : request.status === filterStatus;
      const requesterMatch = filterRequester === ALL_FILTER_VALUE ? true : request.requesterName === filterRequester;
      const departmentMatch = filterDepartment === ALL_FILTER_VALUE ? true : request.departmentCategory === filterDepartment;
      
      let submissionDateMatch = true;
      if (filterSubmissionDate?.from && filterSubmissionDate?.to) {
        try {
          const submissionDateObj = parseISO(request.submissionDate);
          submissionDateMatch = isWithinInterval(submissionDateObj, { 
            start: startOfDay(filterSubmissionDate.from), 
            end: endOfDay(filterSubmissionDate.to) 
          });
        } catch (e) {
          console.error("Error parsing submission date for filtering:", request.submissionDate, e);
          submissionDateMatch = false;
        }
      } else if (filterSubmissionDate?.from) {
         try {
          const submissionDateObj = parseISO(request.submissionDate);
          submissionDateMatch = submissionDateObj >= startOfDay(filterSubmissionDate.from);
        } catch (e) {
           console.error("Error parsing submission date for filtering (from only):", request.submissionDate, e);
           submissionDateMatch = false;
        }
      }

      let userSpecificFilter = true;
      if (currentUser?.role === 'DepartmentEmployee' && !canManageRequests) {
        userSpecificFilter = request.requesterId === currentUser.id;
      }

      return statusMatch && requesterMatch && departmentMatch && submissionDateMatch && userSpecificFilter;
    });
  }, [materialRequests, currentUser, filterStatus, filterRequester, filterDepartment, filterSubmissionDate, canManageRequests]);
  
  const summaryStats = useMemo(() => {
    const stats: Record<MaterialRequestStatus, number> = {
      Pending: 0, Approved: 0, Rejected: 0, Completed: 0, Cancelled: 0,
    };
    filteredRequests.forEach(req => {
      stats[req.status]++;
    });
    return stats;
  }, [filteredRequests]);

  const clearAllFilters = () => {
    setFilterStatus(ALL_FILTER_VALUE);
    setFilterRequester(ALL_FILTER_VALUE);
    setFilterDepartment(ALL_FILTER_VALUE);
    setFilterSubmissionDate(undefined);
  };

  const columns: ColumnDef<MaterialRequest>[] = [
    { accessorKey: "id", header: "Request ID" },
    { accessorKey: "requesterName", header: "Requester" },
    { accessorKey: "departmentCategory", header: "Department" },
    {
      accessorKey: "items",
      header: "Items Requested",
      enableSorting: false,
      cell: ({ row }) => {
        const items = row.original.items;
        if (!items || items.length === 0) return "No items";
        const displayItems = items.slice(0, 2);
        const remainingCount = items.length - displayItems.length;
        const fullListText = items.map(item => `${item.productName} (Qty: ${item.quantity})`).join('\n');

        return (
          <div title={fullListText} className="max-w-[200px]">
            <ul className="list-disc list-inside text-xs truncate">
              {displayItems.map(item => (
                <li key={item.productId}>{`${item.productName} (Qty: ${item.quantity})`}</li>
              ))}
            </ul>
            {remainingCount > 0 && <span className="text-xs text-muted-foreground">...and {remainingCount} more</span>}
          </div>
        );
      }
    },
    { 
      accessorKey: "reasonForRequest", 
      header: "Reason",
      cell: ({ row }) => <div className="max-w-[200px] truncate" title={row.original.reasonForRequest}>{row.original.reasonForRequest}</div>
    },
    {
      accessorKey: "requestedDate",
      header: "Date Needed",
      cell: ({ row }) => <ClientSideFormattedDate dateString={row.original.requestedDate} formatString="PP" />,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        let badgeClass = "";
        switch(status) {
            case "Pending": badgeClass = "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/50 hover:bg-yellow-500/30"; break;
            case "Approved": badgeClass = "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/50 hover:bg-green-500/30"; break;
            case "Completed": badgeClass = "bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/50 hover:bg-blue-500/30"; break;
            case "Rejected": badgeClass = "bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/50 hover:bg-red-500/30"; break;
            case "Cancelled": badgeClass = "bg-slate-500/20 text-slate-700 dark:text-slate-400 border-slate-500/50 hover:bg-slate-500/30"; break;
            default: badgeClass = "bg-secondary text-secondary-foreground border-transparent";
        }
        return <Badge variant="outline" className={cn("font-medium", badgeClass)}>{status}</Badge>;
      },
    },
    {
      accessorKey: "submissionDate",
      header: "Submitted On",
      cell: ({ row }) => <ClientSideFormattedDate dateString={row.original.submissionDate} formatString="PP" />,
    },
    {
        id: "approverAction",
        header: "Approver/Action Info",
        enableSorting: false,
        cell: ({ row }) => {
            const { approverName, approverNotes, status, actionDate } = row.original;
            if (status === 'Pending' || (status === 'Cancelled' && !approverName && !actionDate && !row.original.actionDate)) { 
                 return <span className="text-xs text-muted-foreground">N/A</span>;
            }
            return (
                <div className="text-xs">
                    {approverName && <p className="font-medium">{approverName}</p>}
                    {actionDate && (
                        <p className="text-muted-foreground">
                            <ClientSideFormattedDate dateString={actionDate} formatString="PPp" />
                        </p>
                    )}
                    {approverNotes && <p className="text-muted-foreground truncate max-w-[150px]" title={approverNotes}>{approverNotes}</p>}
                    {status === 'Cancelled' && !approverName && actionDate && <p className="text-muted-foreground">Cancelled by requester</p>}
                </div>
            );
        }
    },
    {
      id: "actions",
      enableSorting: false,
      cell: ({ row }) => {
        const request = row.original;
        const isRequester = currentUser?.id === request.requesterId;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              {canManageRequests && request.status === 'Pending' && (
                <>
                  <DropdownMenuItem onClick={() => handleAction(request.id, 'Approved')}>
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Approve
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    const reason = prompt('Reason for rejection (optional):');
                    if (reason !== null) { 
                      handleAction(request.id, 'Rejected', reason || undefined);
                    }
                  }}>
                    <XCircle className="mr-2 h-4 w-4 text-red-500" /> Reject
                  </DropdownMenuItem>
                </>
              )}
              {isRequester && request.status === 'Pending' && (
                 <>
                  {(canManageRequests && request.status === 'Pending') && <DropdownMenuSeparator />}
                  <DropdownMenuItem onClick={() => { setEditingRequest(request); setIsModalOpen(true); }}>
                    <Edit className="mr-2 h-4 w-4" /> Edit Request
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowCancelConfirm(request)} className="text-orange-600 focus:text-orange-700 focus:bg-orange-100 dark:focus:bg-orange-900/50">
                    <Ban className="mr-2 h-4 w-4" /> Cancel Request
                  </DropdownMenuItem>
                 </>
              )}
              { !(canManageRequests && request.status === 'Pending') && 
                !(isRequester && request.status === 'Pending') &&
                (
                <DropdownMenuItem disabled>No actions available</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Material Requests"
        icon={ClipboardList}
        description={pageDescription}
        actions={
          canCreateRequests ? (
            <Button onClick={() => {setEditingRequest(null); setIsModalOpen(true)}}>
              <PlusCircle className="mr-2 h-4 w-4" /> New Material Request
            </Button>
          ) : null
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <StatDisplayCard title="Pending" value={summaryStats.Pending} icon={Hourglass} colorClass="bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700" />
        <StatDisplayCard title="Approved" value={summaryStats.Approved} icon={ThumbsUp} colorClass="bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700" />
        <StatDisplayCard title="Completed" value={summaryStats.Completed} icon={PackageCheck} colorClass="bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700" />
        <StatDisplayCard title="Rejected" value={summaryStats.Rejected} icon={ThumbsDown} colorClass="bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700" />
        <StatDisplayCard title="Cancelled" value={summaryStats.Cancelled} icon={CircleSlash} colorClass="bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Requests</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row flex-wrap gap-2 items-center">
            <DateRangePicker date={filterSubmissionDate} onDateChange={setFilterSubmissionDate} />
            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value)}>
              <SelectTrigger className="w-full md:w-[180px] h-9">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER_VALUE}>All Statuses</SelectItem>
                {MATERIAL_REQUEST_STATUS_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
              </SelectContent>
            </Select>
             <Select 
                value={filterRequester} 
                onValueChange={(value) => setFilterRequester(value)}
                disabled={currentUser?.role === 'DepartmentEmployee' && !canManageRequests}
            >
              <SelectTrigger className="w-full md:w-[200px] h-9">
                <SelectValue placeholder="All Requesters" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER_VALUE}>All Requesters</SelectItem>
                {uniqueRequesters.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select 
                value={filterDepartment} 
                onValueChange={(value) => setFilterDepartment(value)}
                disabled={currentUser?.role === 'DepartmentEmployee' && !!currentUser.categoryAccess && !canManageRequests}
            >
              <SelectTrigger className="w-full md:w-[200px] h-9">
                <SelectValue placeholder={currentUser?.role === 'DepartmentEmployee' && currentUser.categoryAccess && !canManageRequests ? currentUser.categoryAccess : "All Departments"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER_VALUE}>All Departments</SelectItem>
                {uniqueDepartments.map(dept => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="ghost" onClick={clearAllFilters} className="h-9">
              <Filter className="mr-2 h-4 w-4" /> Clear All Filters
            </Button>
        </CardContent>
      </Card>

      <DataTable columns={columns} data={filteredRequests} filterColumn="id" filterInputPlaceholder="Filter by Request ID..."/>

      {currentUser && (
        <NewMaterialRequestModal
          isOpen={isModalOpen}
          onClose={() => {setIsModalOpen(false); setEditingRequest(null);}}
          onSubmit={editingRequest ? (data) => {
            const updatedReq = {
              ...editingRequest,
              ...data,
              items: data.items, 
              requestedDate: data.requestedDate,
              reasonForRequest: data.reasonForRequest,
            };
            handleUpdateRequest(updatedReq);
            setEditingRequest(null);
          } : handleAddNewRequestFromPage}
          currentUser={currentUser}
          existingRequest={editingRequest}
        />
      )}

      {showCancelConfirm && (
        <AlertDialog open={!!showCancelConfirm} onOpenChange={() => setShowCancelConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Cancellation</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to cancel material request <span className="font-semibold">{showCancelConfirm.id}</span>? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowCancelConfirm(null)}>No, keep request</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                     if (showCancelConfirm?.requesterId === currentUser?.id && showCancelConfirm.status === 'Pending') {
                        handleAction(showCancelConfirm.id, 'Cancelled');
                    } else {
                        toast({ title: "Action Denied", description: "Only the requester can cancel a pending request.", variant: "destructive"});
                    }
                }}
                className="bg-orange-600 text-orange-50 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-800"
              >
                Yes, Cancel Request
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
