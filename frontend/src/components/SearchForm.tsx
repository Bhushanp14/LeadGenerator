import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Lead } from '@/types/lead';

interface SearchFormProps {
  onGenerateLeads: (businessType: string, cityArea: string) => void;
  isLoading: boolean;
}

const SearchForm: React.FC<SearchFormProps> = ({ onGenerateLeads, isLoading }) => {
  const [businessType, setBusinessType] = useState<string>('');
  const [cityArea, setCityArea] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerateLeads(businessType, cityArea);
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="text-center text-2xl text-gray-800">Find Your Leads</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="businessType">Business Type</Label>
            <Input
              id="businessType"
              type="text"
              placeholder="e.g., Salon, Restaurant"
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              disabled={isLoading}
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cityArea">City / Area</Label>
            <Input
              id="cityArea"
              type="text"
              placeholder="e.g., Pune, Koregaon Park"
              value={cityArea}
              onChange={(e) => setCityArea(e.target.value)}
              disabled={isLoading}
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={isLoading}>
            {isLoading ? 'Generating...' : 'Generate Leads'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SearchForm;