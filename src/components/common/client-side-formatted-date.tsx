
"use client";

import { useState, useEffect } from 'react';
import { format, parseISO, isValid } from 'date-fns';

interface ClientSideFormattedDateProps {
  dateString: string | undefined | null;
  formatString: string;
  fallback?: React.ReactNode; // What to show during SSR, initial client render, and for invalid/null dates
}

export function ClientSideFormattedDate({
  dateString,
  formatString,
  fallback = <span className="text-xs text-muted-foreground">--</span>,
}: ClientSideFormattedDateProps) {
  const [clientFormattedDate, setClientFormattedDate] = useState<React.ReactNode | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); // Indicates component has mounted on the client
    if (typeof dateString === 'string') {
      try {
        const dateObj = parseISO(dateString); // Assuming dateString is ISO
        if (isValid(dateObj)) {
          setClientFormattedDate(format(dateObj, formatString));
        } else {
          console.warn("ClientSideFormattedDate: Invalid date string provided:", dateString);
          setClientFormattedDate(fallback); 
        }
      } catch (error) {
        console.error("ClientSideFormattedDate: Error formatting date:", error);
        setClientFormattedDate(fallback);
      }
    } else {
      // dateString is null or undefined
      setClientFormattedDate(fallback);
    }
  }, [dateString, formatString, fallback]);

  if (!isClient) {
    // Render fallback on the server and during initial client render before useEffect runs
    return <>{fallback}</>; 
  }

  // Client render after useEffect has set the clientFormattedDate
  return <>{clientFormattedDate}</>;
}
