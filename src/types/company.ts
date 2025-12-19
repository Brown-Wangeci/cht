export type CompanyData = {
  schemaVersion: string;
  lastReviewed: string;

  company: {
    legalName: string;
    tradeNames: string[];
    brands: string[];
    website: string;
    summary: string;
    ownershipModel: string;
    about: {
      positioning: string;
      nameMeaning: string;
    };
  };

  contacts: {
    primary: {
      email: string;
      phone: string;
    };
    support: {
      email: string | null;
      phone: string | null;
    };
  };

  location: {
    label: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    postalCode: string;
    poBox: string;
    country: string;
    sourceNote: string;
  };

  brand: {
    primaryBrand: string;
    taglines: string[];
    story: {
      region: string;
      elevationMeters: number;
      elevationFeet: number;
    };
  };

  social: {
    facebook: string | null;
    instagram: string | null;
    linkedin: string | null;
    x: string | null;
    youtube: string | null;
  };
};
