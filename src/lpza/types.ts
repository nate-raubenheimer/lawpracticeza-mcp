/**
 * Schema-derived types from https://lawpracticeza.com/docs/schema.html
 * Field names match API / database columns (snake_case).
 */

/** Object: customer (Client) */
export interface Customer {
  customer_id?: string;
  customer_code: string;
  customer_name: string;
  tradingas?: string;
  entitytype_uid?: string;
  taxnumber?: string;
  regnumber?: string;
  idnumber?: string;
  title?: string;
  firstname?: string;
  surname?: string;
  cell?: string;
  tel?: string;
  fax?: string;
  email?: string;
  accountsemail?: string;
  password?: string;
  website?: string;
  extratelnumbers?: string;
  streetaddress?: string;
  postaladdress?: string;
  directions?: string;
  coord?: string;
  notes?: string;
  creditterms?: string;
  bankname?: string;
  bankaccount?: string;
  bankbranch?: number;
  taxtype_uid?: string;
  login_uid: string;
  stampdate: string;
  scrapdate: string;
  effectivedate?: string;
  expirydate?: string;
  rev: number;
  department_id: string;
  birthday?: string;
  sendstatement: boolean;
  soundex?: string;
  data?: string;
}

/** Object: matter */
export interface Matter {
  matter_id?: string;
  matter_code: string;
  matter_name: string;
  owner_salesagent_id?: string;
  cssclass?: string;
  customer_id: string;
  feelevel_uid?: string;
  title?: string;
  firstname?: string;
  surname?: string;
  email?: string;
  accountsemail?: string;
  address?: string;
  cell?: string;
  workphone?: string;
  fax?: string;
  department_id?: string;
  dateopened: string;
  reservetrust?: number;
  deadfilenumber?: string;
  effectivedate?: string;
  expirydate?: string;
  stampdate: string;
  scrapdate: string;
  login_uid: string;
  rev: number;
  soundex?: string;
}

export type MatterDraftLineItemStatus = 'Draft' | 'Billed' | 'Deleted';

/** Object: matterdraftlineitem (draft fees & disbursements) */
export interface MatterDraftLineItem {
  matterdraftlineitem_uid?: string;
  matterdraftlineitem_name?: string;
  customer_id: string;
  matter_id?: string;
  currency_uid: string;
  product_id: string;
  unitprice: number;
  taxtype_uid: string;
  tax?: number;
  trantotal?: number;
  salesagent_id: string;
  status: MatterDraftLineItemStatus;
  salesinvoice_uid?: string;
  salescreditnote_uid?: string;
  login_uid: string;
  qty: number;
  minutes?: number;
  date: string;
  stampdate: string;
  created: string;
  rev: number;
  srcid?: string;
}

/** Object: product (posting code) */
export interface Product {
  product_id?: string;
  product_code: string;
  product_name: string;
  productcategory_id: string;
  department_id?: string;
  unit_uid: string;
  unitprice?: number;
  costprice?: number;
  taxtype_uid: string;
  login_uid: string;
  stampdate: string;
  scrapdate: string;
  effectivedate?: string;
  expirydate?: string;
  rev: number;
  factory_uid?: string;
  account_id?: string;
}

/** Object: productcategory (posting code category) */
export interface ProductCategory {
  productcategory_id?: string;
  productcategory_name: string;
  parent_productcategory_id?: string;
  account_id?: string;
  unbilled_account_id?: string;
  department_id?: string;
  stampdate: string;
  scrapdate: string;
  effectivedate?: string;
  expirydate?: string;
  login_uid: string;
  rev: number;
}

export type BankAccountBticode = 'B' | 'T' | 'I';

/** Object: bankaccount */
export interface BankAccount {
  bankaccount_uid?: string;
  bticode: BankAccountBticode;
  bankaccount_name: string;
  bankaccount_code?: string;
  login_uid: string;
  rev: number;
  stampdate: string;
  supplier_id?: string;
  reconcile: boolean;
  account_id: string;
  matter_id?: string;
  department_id: string;
}

/** `access.login` success payload */
export interface LoginResponse {
  token: string;
}

/** `access.status` when logged in */
export interface AccessStatusLoggedIn {
  signon_uid: string | null;
  pincode: string | null;
  freezedate: string;
  zones: string;
  activationdate: string | null;
  sessiontimeout: number;
  login_uid: string;
  tagcode: string | null;
  archived: number;
  loggedin: true;
  database: string;
  stampdate: string;
  rev: number;
  login_code: string;
  email: string;
  token: string;
  points: number;
  gravatar: string;
  activationcode: string | null;
  sessiontimeupdated: boolean;
  login_name: string;
}

/** `access.status` when not logged in */
export interface AccessStatusLoggedOut {
  loggedin: false;
  database: null;
}

export type AccessStatus = AccessStatusLoggedIn | AccessStatusLoggedOut;

/** `customer.insert` / `matter.insert` success payload */
export interface InsertResponse {
  id: string;
  success: boolean;
}

/** `matter.update` success payload */
export interface UpdateResponse {
  id: string;
  success: boolean;
  recordcount: number;
}

/** `matter.detail` wrapper */
export interface DetailResponse<T> {
  data: T;
}

/** `matterset.createtransfer` success payload */
export interface CreateTransferResponse {
  seller_matter_id: string;
  buyer_matter_id: string;
  matterset_uid: string;
}

/** `matterdraftlineitem.childlist` success payload */
export interface ChildListResponse<T = MatterDraftLineItem> {
  data: T[];
  results: number;
}

/** `matterdraftlineitem.upsert` success payload */
export interface UpsertDraftFeeResponse {
  uid: number;
  success: boolean;
  detail: Record<string, unknown>;
}

/** `matterdraftlineitem.quickdelete` success payload */
export interface QuickDeleteResponse {
  numdeleted: number;
}

/** `matter.bill` success payload */
export interface BillResponse {
  what: string;
  uid: string;
}

/** Enriched `matter.bill` result with invoice web and PDF URLs */
export interface BillMatterResult extends BillResponse {
  salesinvoice_detail_url: string;
  salesinvoice_pdf_url: string;
}
