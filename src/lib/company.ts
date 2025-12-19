import companyJson from "@/data/company-data.json";
import type { CompanyData } from "@/types/company";

export function getCompany(): CompanyData {
  return companyJson as CompanyData;
}
