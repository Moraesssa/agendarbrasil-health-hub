
// FHIR R4 TypeScript interfaces for the resources we're using

export interface FhirResource {
  resourceType: string;
  id?: string;
  meta?: FhirMeta;
}

export interface FhirMeta {
  lastUpdated?: string;
  source?: string;
  versionId?: string;
}

export interface FhirCoding {
  system?: string;
  code?: string;
  display?: string;
}

export interface FhirCodeableConcept {
  coding?: FhirCoding[];
  text?: string;
}

export interface FhirQuantity {
  value?: number;
  unit?: string;
  system?: string;
  code?: string;
}

export interface FhirReference {
  reference?: string;
  type?: string;
  identifier?: FhirIdentifier;
  display?: string;
}

export interface FhirIdentifier {
  use?: string;
  type?: FhirCodeableConcept;
  system?: string;
  value?: string;
}

export interface FhirHumanName {
  use?: 'usual' | 'official' | 'temp' | 'nickname' | 'anonymous' | 'old' | 'maiden';
  text?: string;
  family?: string;
  given?: string[];
  prefix?: string[];
  suffix?: string[];
}

export interface FhirContactPoint {
  system?: 'phone' | 'fax' | 'email' | 'pager' | 'url' | 'sms' | 'other';
  value?: string;
  use?: 'home' | 'work' | 'temp' | 'old' | 'mobile';
  rank?: number;
}

export interface FhirAddress {
  use?: 'home' | 'work' | 'temp' | 'old' | 'billing';
  type?: 'postal' | 'physical' | 'both';
  text?: string;
  line?: string[];
  city?: string;
  district?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface FhirPatient extends FhirResource {
  resourceType: 'Patient';
  active?: boolean;
  name?: FhirHumanName[];
  telecom?: FhirContactPoint[];
  gender?: 'male' | 'female' | 'other' | 'unknown';
  birthDate?: string;
  address?: FhirAddress[];
}

export interface FhirObservationComponent {
  code: FhirCodeableConcept;
  valueQuantity?: FhirQuantity;
  valueString?: string;
  valueBoolean?: boolean;
}

export interface FhirObservation extends FhirResource {
  resourceType: 'Observation';
  status: 'registered' | 'preliminary' | 'final' | 'amended' | 'corrected' | 'cancelled' | 'entered-in-error' | 'unknown';
  category?: FhirCodeableConcept[];
  code: FhirCodeableConcept;
  subject?: FhirReference;
  effectiveDateTime?: string;
  valueQuantity?: FhirQuantity;
  valueString?: string;
  valueBoolean?: boolean;
  component?: FhirObservationComponent[];
}

export interface FhirDocumentReference extends FhirResource {
  resourceType: 'DocumentReference';
  status: 'current' | 'superseded' | 'entered-in-error';
  type?: FhirCodeableConcept;
  category?: FhirCodeableConcept[];
  subject?: FhirReference;
  date?: string;
  author?: FhirReference[];
  description?: string;
  content: FhirDocumentReferenceContent[];
}

export interface FhirDocumentReferenceContent {
  attachment: FhirAttachment;
}

export interface FhirAttachment {
  contentType?: string;
  language?: string;
  data?: string;
  url?: string;
  size?: number;
  hash?: string;
  title?: string;
  creation?: string;
}

export interface FhirBundle extends FhirResource {
  resourceType: 'Bundle';
  type: 'document' | 'message' | 'transaction' | 'transaction-response' | 'batch' | 'batch-response' | 'history' | 'searchset' | 'collection';
  total?: number;
  link?: FhirBundleLink[];
  entry?: FhirBundleEntry[];
}

export interface FhirBundleLink {
  relation: string;
  url: string;
}

export interface FhirBundleEntry {
  fullUrl?: string;
  resource?: FhirResource;
  search?: FhirBundleEntrySearch;
}

export interface FhirBundleEntrySearch {
  mode?: 'match' | 'include' | 'outcome';
  score?: number;
}

export interface FhirOperationOutcome extends FhirResource {
  resourceType: 'OperationOutcome';
  issue: FhirOperationOutcomeIssue[];
}

export interface FhirOperationOutcomeIssue {
  severity: 'fatal' | 'error' | 'warning' | 'information';
  code: string;
  details?: FhirCodeableConcept;
  diagnostics?: string;
  location?: string[];
  expression?: string[];
}
