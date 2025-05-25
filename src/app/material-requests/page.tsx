
// src/app/material-requests/page.tsx
"use client";

import React, { useState, useMemo } from 'react';
import { PageHeader } from "@/components/common/page-header";
import { DataTable } from "@/components/common/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, PlusCircle, Filter, MoreHorizontal, CheckCircle, XCircle, Edit, Ban } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { useAuth } from '@/contexts/auth-context';
import type { MaterialRequest, MaterialRequestStatus, UserRole, RequestedItem } from '@/lib/types';
import { MOCK_MATERIAL_REQUESTS, MATERIAL_REQUEST_STATUS_OPTIONS, ALL_FILTER_VALUE } from '@/lib/constants';
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
import type { DateRange } from 'react-day-picker';
import { addDays, startOfDay, endOfDay, isWithinInterval, format } from 'date-fns';
import { cn } from "@/lib/utils";


export default function MaterialRequestsPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<MaterialRequest[]>(MOCK_MATERIAL_REQUESTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<MaterialRequest | null>(null);
  
  // Filter states
  const [filterStatus, setFilterStatus] = useState<string>(ALL_FILTER_VALUE);
  const [filterRequester, setFilterRequester] = useState<string>(ALL_FILTER_VALUE);
  const [filterDepartment, setFilterDepartment] = useState<string>(ALL_FILTER_VALUE);
  const [filterSubmissionDate, setFilterSubmissionDate] = useState<DateRange | undefined>(undefined);

  const [showCancelConfirm, setShowCancelConfirm] = useState<MaterialRequest | null>(null);

  const canCreateRequests = currentUser?.role === 'DepartmentEmployee';
  const canManageRequests = currentUser?.role === 'Admin' || currentUser?.role === 'WarehouseManager';

  const pageDescription = useMemo(() => {
    if (canManageRequests) {
      return "Review, approve, or reject material requests submitted by departments. You can also track the status of all requests using the filters below.";
    }
    if (canCreateRequests) {
      return "Submit new requests for materials for your department. You can view, edit (if pending), or cancel your submitted requests.";
    }
    return "View material requests. Contact an administrator for more permissions or to submit requests.";
  }, [canManageRequests, canCreateRequests]);

  const uniqueRequesters = useMemo(() => {
    const requesters = new Set(MOCK_MATERIAL_REQUESTS.map(r => r.requesterName));
    return Array.from(requesters).sort();
  }, []); 

  const uniqueDepartments = useMemo(() => {
    const departments = new Set(MOCK_MATERIAL_REQUESTS.map(r => r.departmentCategory));
    return Array.from(departments).sort();
  }, []); 


  const handleAddNewRequest = (newRequest: Omit<MaterialRequest, 'id' | 'submissionDate' | 'status' | 'requesterId' | 'requesterName' | 'departmentCategory'>) => {
    if (!currentUser) return;
    const fullNewRequest: MaterialRequest = {
      id: `mr${Date.now()}`, 
      submissionDate: new Date().toISOString(),
      status: 'Pending',
      requesterId: currentUser.id,
      requesterName: currentUser.name,
      departmentCategory: currentUser.categoryAccess || 'N/A',
      ...newRequest,
    };
    setRequests(prev => [fullNewRequest, ...prev]);
    toast({ title: "Material Request Submitted", description: "Your request has been submitted for approval." });
  };

  const handleUpdateRequest = (updatedRequest: MaterialRequest) => {
    setRequests(prev => prev.map(req => req.id === updatedRequest.id ? updatedRequest : req));
    toast({ title: "Material Request Updated", description: `Request ${updatedRequest.id} has been updated.`});
  }

  const handleAction = (requestId: string, newStatus: MaterialRequestStatus, notes?: string) => {
    if (!currentUser) return;

    const requestToUpdate = requests.find(r => r.id === requestId);
    if (!requestToUpdate) {
        toast({ title: "Error", description: "Request not found.", variant: "destructive"});
        return;
    }
    
    const isManagerAction = (newStatus === 'Approved' || newStatus === 'Rejected') && canManageRequests;
    const isRequesterAction = newStatus === 'Cancelled' && requestToUpdate.requesterId === currentUser.id;

    if (!isManagerAction && !isRequesterAction) {
        toast({ title: "Permission Denied", description: "You do not have permission to perform this action.", variant: "destructive"});
        return;
    }

    setRequests(prevRequests =>
      prevRequests.map(req =>
        req.id === requestId
          ? {
              ...req,
              status: newStatus,
              approverId: isManagerAction ? currentUser.id : req.approverId,
              approverName: isManagerAction ? currentUser.name : req.approverName,
              actionDate: new Date().toISOString(),
              approverNotes: notes || req.approverNotes,
            }
          : req
      )
    );
    toast({ title: `Request ${newStatus}`, description: `Request ${requestId} has been ${newStatus.toLowerCase()}.` });
    if (showCancelConfirm?.id === requestId) {
      setShowCancelConfirm(null);
    }
  };


  const filteredRequests = useMemo(() => {
    return requests.filter(request => {
      const statusMatch = filterStatus === ALL_FILTER_VALUE ? true : request.status === filterStatus;
      const requesterMatch = filterRequester === ALL_FILTER_VALUE ? true : request.requesterName === filterRequester;
      const departmentMatch = filterDepartment === ALL_FILTER_VALUE ? true : request.departmentCategory === filterDepartment;
      
      let submissionDateMatch = true;
      if (filterSubmissionDate?.from && filterSubmissionDate?.to) {
        try {
          const submissionDate = new Date(request.submissionDate);
          submissionDateMatch = isWithinInterval(submissionDate, { 
            start: startOfDay(filterSubmissionDate.from), 
            end: endOfDay(filterSubmissionDate.to) 
          });
        } catch (e) {
          console.error("Error parsing submission date for filtering:", request.submissionDate, e);
          submissionDateMatch = false;
        }
      } else if (filterSubmissionDate?.from) {
         try {
          const submissionDate = new Date(request.submissionDate);
          submissionDateMatch = submissionDate >= startOfDay(filterSubmissionDate.from);
        } catch (e) {
           console.error("Error parsing submission date for filtering (from only):", request.submissionDate, e);
           submissionDateMatch = false;
        }
      }


      let userSpecificFilter = true;
      if (currentUser?.role === 'DepartmentEmployee' && !canManageRequests) { // Ensure managers see all
        userSpecificFilter = request.requesterId === currentUser.id;
      }

      return statusMatch && requesterMatch && departmentMatch && submissionDateMatch && userSpecificFilter;
    });
  }, [requests, currentUser, filterStatus, filterRequester, filterDepartment, filterSubmissionDate, canManageRequests]);
  
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
      cell: ({ row }) => {
        const items = row.original.items;
        if (!items || items.length === 0) return "No items";
        return (
          <ul className="list-disc list-inside text-xs max-w-[200px] truncate">
            {items.map(item => (
              <li key={item.productId} title={`${item.productName} (Qty: ${item.quantity})`}>{`${item.productName} (Qty: ${item.quantity})`}</li>
            ))}
          </ul>
        )
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
      cell: ({ row }) => new Date(row.original.requestedDate).toLocaleDateString(),
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
      cell: ({ row }) => format(new Date(row.original.submissionDate), "PP"),
    },
    {
        id: "approverAction",
        header: "Approver/Action Info",
        cell: ({ row }) => {
            const { approverName, approverNotes, status, actionDate } = row.original;
            if (status === 'Pending' || (status === 'Cancelled' && !approverName && !actionDate)) {
                 return <span className="text-xs text-muted-foreground">N/A</span>;
            }
            return (
                <div className="text-xs">
                    {approverName && <p className="font-medium">{approverName}</p>}
                    {actionDate && <p className="text-muted-foreground">{format(new Date(actionDate), "PPp")}</p>}
                    {approverNotes && <p className="text-muted-foreground truncate max-w-[150px]" title={approverNotes}>{approverNotes}</p>}
                    {status === 'Cancelled' && !approverName && actionDate && <p className="text-muted-foreground">Cancelled by requester</p>}
                </div>
            )
        }
    },
    {
      id: "actions",
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

      <div className="space-y-4 pt-2">
         <div className="flex flex-col md:flex-row flex-wrap gap-2 items-center">
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
        </div>
        <DataTable columns={columns} data={filteredRequests} filterColumn="id" filterInputPlaceholder="Filter by Request ID..."/>
      </div>

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
          } : handleAddNewRequest}
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
                     if (showCancelConfirm?.requesterId === currentUser?.id) {
                        handleAction(showCancelConfirm.id, 'Cancelled');
                    } else {
                        toast({ title: "Permission Denied", description: "Only the requester can cancel this request.", variant: "destructive"});
                    }
                }}
                className="bg-orange-600 text-orange-50 hover:bg-orange-700"
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

  