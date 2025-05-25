
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
} from "@/components/ui/alert-dialog"; // AlertDialogTrigger removed as it's part of DropdownMenuItem


export default function MaterialRequestsPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<MaterialRequest[]>(MOCK_MATERIAL_REQUESTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<MaterialRequest | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [showCancelConfirm, setShowCancelConfirm] = useState<MaterialRequest | null>(null);

  const canCreateRequests = currentUser?.role === 'DepartmentEmployee';
  const canManageRequests = currentUser?.role === 'Admin' || currentUser?.role === 'WarehouseManager';

  const pageDescription = useMemo(() => {
    if (canManageRequests) {
      return "Review, approve, or reject material requests submitted by departments. You can also track the status of all requests.";
    }
    if (canCreateRequests) {
      return "Submit new requests for materials for your department. You can view, edit (if pending), or cancel your submitted requests.";
    }
    return "View material requests. Contact an administrator for more permissions or to submit requests.";
  }, [canManageRequests, canCreateRequests]);

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
              approverNotes: notes || req.approverNotes, // Keep existing notes if new ones aren't provided
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
      const statusMatch = filterStatus ? request.status === filterStatus : true;
      if (currentUser?.role === 'DepartmentEmployee') {
        return request.requesterId === currentUser.id && statusMatch;
      }
      return statusMatch;
    });
  }, [requests, currentUser, filterStatus]);

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
          <ul className="list-disc list-inside text-xs">
            {items.map(item => (
              <li key={item.productId}>{`${item.productName} (Qty: ${item.quantity})`}</li>
            ))}
          </ul>
        )
      }
    },
    { accessorKey: "reasonForRequest", header: "Reason" },
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
            case "Pending": badgeClass = "bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200"; break;
            case "Approved": badgeClass = "bg-green-100 text-green-800 border-green-300 hover:bg-green-200"; break;
            case "Completed": badgeClass = "bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200"; break;
            case "Rejected": badgeClass = "bg-red-100 text-red-800 border-red-300 hover:bg-red-200"; break;
            case "Cancelled": badgeClass = "bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200"; break;
            default: badgeClass = "bg-secondary text-secondary-foreground border-transparent";
        }
        
        return <Badge variant={
            status === "Rejected" || status === "Cancelled" ? "destructive" : 
            status === "Pending" ? "outline" : "default"
        } className={badgeClass}>{status}</Badge>;
      },
    },
    {
      accessorKey: "submissionDate",
      header: "Submitted On",
      cell: ({ row }) => new Date(row.original.submissionDate).toLocaleDateString(),
    },
    {
        accessorKey: "approverName",
        header: "Approver/Notes",
        cell: ({ row }) => {
            const { approverName, approverNotes, status } = row.original;
            if (status === 'Pending' || status === 'Cancelled' && !approverName) return <span className="text-xs text-muted-foreground">N/A</span>;
            return (
                <div className="text-xs">
                    {approverName && <p className="font-medium">{approverName}</p>}
                    {approverNotes && <p className="text-muted-foreground truncate max-w-[150px]" title={approverNotes}>{approverNotes}</p>}
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
                    // prompt returns null if cancelled, empty string if OK with no input
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
                  <DropdownMenuItem onClick={() => setShowCancelConfirm(request)}>
                    <Ban className="mr-2 h-4 w-4 text-orange-500" /> Cancel Request
                  </DropdownMenuItem>
                 </>
              )}
              {(request.status !== 'Pending' || (!canManageRequests && !isRequester)) && (!isRequester || request.status !== 'Pending') && (
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
            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value === ALL_FILTER_VALUE ? "" : value)}>
              <SelectTrigger className="w-full md:w-[180px] h-9">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER_VALUE}>All Statuses</SelectItem>
                {MATERIAL_REQUEST_STATUS_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="ghost" onClick={() => setFilterStatus('')} className="h-9">
              <Filter className="mr-2 h-4 w-4" /> Clear Filters
            </Button>
        </div>
        <DataTable columns={columns} data={filteredRequests} filterColumn="requesterName" filterInputPlaceholder="Filter by requester..."/>
      </div>

      {currentUser && (
        <NewMaterialRequestModal
          isOpen={isModalOpen}
          onClose={() => {setIsModalOpen(false); setEditingRequest(null);}}
          onSubmit={editingRequest ? (data) => {
            const updatedReq = {
              ...editingRequest,
              ...data,
              items: data.items, // Ensure items are correctly mapped
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
                onClick={() => handleAction(showCancelConfirm.id, 'Cancelled')}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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

