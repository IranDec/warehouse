
// src/app/material-requests/page.tsx
"use client";

import React, { useState, useMemo } from 'react';
import { PageHeader } from "@/components/common/page-header";
import { DataTable } from "@/components/common/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, PlusCircle, Filter, MoreHorizontal, CheckCircle, XCircle, Edit } from "lucide-react";
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


export default function MaterialRequestsPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<MaterialRequest[]>(MOCK_MATERIAL_REQUESTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<MaterialRequest | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('');

  const canCreateRequests = currentUser?.role === 'DepartmentEmployee';
  const canManageRequests = currentUser?.role === 'Admin' || currentUser?.role === 'WarehouseManager';

  const handleAddNewRequest = (newRequest: Omit<MaterialRequest, 'id' | 'submissionDate' | 'status' | 'requesterId' | 'requesterName' | 'departmentCategory'>) => {
    if (!currentUser) return;
    const fullNewRequest: MaterialRequest = {
      id: `mr${Date.now()}`, // Simple unique ID for mock
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
    setRequests(prevRequests =>
      prevRequests.map(req =>
        req.id === requestId
          ? {
              ...req,
              status: newStatus,
              approverId: currentUser.id,
              approverName: currentUser.name,
              actionDate: new Date().toISOString(),
              approverNotes: notes || req.approverNotes,
            }
          : req
      )
    );
    toast({ title: `Request ${newStatus}`, description: `Request ${requestId} has been ${newStatus.toLowerCase()}.` });
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
        let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "default";
        if (status === "Pending") badgeVariant = "outline"; // Yellowish
        if (status === "Approved" || status === "Completed") badgeVariant = "default"; // Greenish
        if (status === "Rejected" || status === "Cancelled") badgeVariant = "destructive";

        return <Badge variant={badgeVariant} className={
          status === 'Pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
          status === 'Approved' ? 'bg-green-100 text-green-800 border-green-300' :
          status === 'Completed' ? 'bg-blue-100 text-blue-800 border-blue-300' : ''
        }>{status}</Badge>;
      },
    },
    {
      accessorKey: "submissionDate",
      header: "Submitted On",
      cell: ({ row }) => new Date(row.original.submissionDate).toLocaleDateString(),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const request = row.original;
        if (!canManageRequests || request.status !== 'Pending') {
          return null; // Or a view details button for all roles
        }
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
              <DropdownMenuItem onClick={() => handleAction(request.id, 'Approved')}>
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Approve
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { /* Open a small dialog for rejection reason */ handleAction(request.id, 'Rejected', prompt('Reason for rejection (optional):') || undefined)}}>
                <XCircle className="mr-2 h-4 w-4 text-red-500" /> Reject
              </DropdownMenuItem>
               {/* Add edit for pending requests if submitter */}
              {currentUser?.id === request.requesterId && request.status === 'Pending' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => { setEditingRequest(request); setIsModalOpen(true); }}>
                    <Edit className="mr-2 h-4 w-4" /> Edit Request
                  </DropdownMenuItem>
                </>
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
        description="Submit and manage requests for raw materials and components."
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
            // For editing, we need to merge existing data with new data
            const updatedReq = {
              ...editingRequest,
              ...data,
              items: data.items, // Ensure items are overwritten
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
    </div>
  );
}
