import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Lead } from '@/types/lead';
import { Download } from 'lucide-react';

interface LeadTableProps {
  leads: Lead[];
  onDownload?: () => void; // optional callback from parent
}

const LeadTable: React.FC<LeadTableProps> = ({ leads, onDownload }) => {
  return (
    <div className="w-full max-w-4xl mx-auto mt-8 p-6 bg-white shadow-lg rounded-lg">
      {leads.length > 0 ? (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-gray-700">Business Name</TableHead>
                <TableHead className="text-gray-700">Address</TableHead>
                <TableHead className="text-gray-700">Phone Number</TableHead>
                <TableHead className="text-gray-700">Website</TableHead>
                <TableHead className="text-gray-700">Rating</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{lead.name}</TableCell>
                  <TableCell>{lead.address}</TableCell>
                  <TableCell>{lead.phone}</TableCell>
                  <TableCell>
                    {lead.website ? (
                      <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Visit Website
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
                  <TableCell>{lead.rating}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>


        </>
      ) : (
        <p className="text-center text-gray-500">
          No leads generated yet. Use the form above to find some!
        </p>
      )}
    </div>
  );
};

export default LeadTable;