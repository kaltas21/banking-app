export type AccountType = 'Checking' | 'Savings';
export type AccountStatus = 'Active' | 'Inactive' | 'Closed';
export type CardType = 'Debit' | 'Credit';
export type CardStatus = 'Active' | 'Inactive' | 'Expired';
export type LoanStatus = 'Pending' | 'Approved' | 'Rejected' | 'Paid Off';
export type TransactionType = 'Transfer' | 'Deposit' | 'Withdrawal' | 'Bill Payment';
export type EmployeeRole = 'Admin' | 'Customer Service' | 'Loan Officer';

export interface Customer {
  customer_id: number;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone_number?: string;
  address?: string;
  date_of_birth?: Date;
}

export interface Employee {
  employee_id: number;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: EmployeeRole;
  hire_date?: Date;
  date_of_birth?: Date;
}

export interface Account {
  account_id: number;
  customer_id: number;
  account_number: string;
  account_type: AccountType;
  balance: number;
  status: AccountStatus;
}

export interface Card {
  card_id: number;
  account_id: number;
  card_number: string;
  card_type: CardType;
  expiry_date: Date;
  cvv: string;
  status: CardStatus;
}

export interface Transaction {
  transaction_id: number;
  from_account_id?: number;
  to_account_id?: number;
  amount: number;
  transaction_type: TransactionType;
  description?: string;
  transaction_date: Date;
}

export interface Loan {
  loan_id: number;
  customer_id: number;
  loan_amount: number;
  interest_rate: number;
  term_months: number;
  status: LoanStatus;
  application_date: Date;
  approved_by_employee_id?: number;
}

export interface BillPayment {
  payment_id: number;
  account_id: number;
  biller_name: string;
  biller_account_number: string;
  amount: number;
  payment_date: Date;
}