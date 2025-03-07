"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Company } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building, MapPin, Users, Briefcase, Search } from "lucide-react";
import Link from "next/link";

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [industries, setIndustries] = useState<string[]>([]);

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    filterCompanies();
  }, [searchQuery, selectedIndustry, companies]);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .order("name");

      if (error) throw error;
      
      setCompanies(data || []);
      
      // Extract unique industries
      const uniqueIndustries = Array.from(
        new Set(data?.map((company) => company.industry).filter(Boolean))
      ) as string[];
      
      setIndustries(uniqueIndustries);
    } catch (error) {
      console.error("Error fetching companies:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterCompanies = () => {
    let filtered = companies;
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (company) =>
          company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (company.description && company.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (company.industry && company.industry.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Filter by industry
    if (selectedIndustry) {
      filtered = filtered.filter(
        (company) => company.industry === selectedIndustry
      );
    }
    
    setFilteredCompanies(filtered);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    filterCompanies();
  };

  const handleIndustrySelect = (industry: string | null) => {
    setSelectedIndustry(industry === selectedIndustry ? null : industry);
  };

  const getCompanySize = (size: string) => {
    switch (size) {
      case "Small":
        return "1-50 employees";
      case "Medium":
        return "51-500 employees";
      case "Large":
        return "500+ employees";
      default:
        return size;
    }
  };

  return (
    <div className="container py-8 mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Companies</h1>
          <p className="text-muted-foreground">
            Discover innovative startups and growing companies
          </p>
        </div>
        <form onSubmit={handleSearch} className="flex w-full md:w-auto">
          <Input
            placeholder="Search companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mr-2"
          />
          <Button type="submit" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <Card className="sticky top-20">
            <CardContent className="p-4">
              <h2 className="font-semibold mb-2">Filter by Industry</h2>
              <div className="space-y-1">
                {industries.map((industry) => (
                  <Button
                    key={industry}
                    variant={selectedIndustry === industry ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => handleIndustrySelect(industry)}
                  >
                    {industry}
                  </Button>
                ))}
                {selectedIndustry && (
                  <Button
                    variant="outline"
                    className="w-full mt-2"
                    onClick={() => setSelectedIndustry(null)}
                  >
                    Clear Filter
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : filteredCompanies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCompanies.map((company) => (
                <Link key={company.id} href={`/companies/${company.id}`}>
                  <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-0">
                      <div className="h-32 bg-muted flex items-center justify-center p-4 border-b">
                        {company.logo_url ? (
                          <img
                            src={company.logo_url}
                            alt={company.name}
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <Building className="h-16 w-16 text-muted-foreground" />
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-semibold">{company.name}</h3>
                        {company.industry && (
                          <Badge variant="secondary" className="mt-1">
                            {company.industry}
                          </Badge>
                        )}
                        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                          {company.location && (
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              <span>{company.location}</span>
                            </div>
                          )}
                          {company.size && (
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              <span>{getCompanySize(company.size)}</span>
                            </div>
                          )}
                          {company.founded_year && (
                            <div className="flex items-center">
                              <Building className="h-4 w-4 mr-1" />
                              <span>Founded in {company.founded_year}</span>
                            </div>
                          )}
                        </div>
                        {company.description && (
                          <p className="mt-2 text-sm line-clamp-2">
                            {company.description}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Building className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">No companies found</h3>
                <p className="text-muted-foreground mb-4">
                  No companies match your search criteria. Try adjusting your filters.
                </p>
                <Button onClick={() => {
                  setSearchQuery("");
                  setSelectedIndustry(null);
                }}>
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}