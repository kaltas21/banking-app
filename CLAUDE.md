# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack banking application built with Next.js 15, PostgreSQL (via Supabase), and NextAuth for authentication. The application provides customer banking features (accounts, transfers, loans) and an admin interface for bank employees.

## Essential Commands

```bash
# Development
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint

# Database Testing (from /scripts)
node scripts/test-connection.js    # Test database connectivity
node scripts/check-tables.js       # Verify table structure
```

## Architecture & Key Patterns

### Authentication Flow
- NextAuth with credentials provider in `lib/auth.ts`
- Two user types: customers (from Customers table) and employees (from Employees table)
- JWT sessions with role-based access control
- Middleware protection in `middleware.ts` routes traffic based on user type

### Database Access Pattern
- Primary: Direct PostgreSQL via `pg` library (`lib/db.ts`)
- Secondary: Supabase client for specific operations (`lib/db-supabase.ts`)
- All database queries use try-catch with proper error handling
- Transactions for transfer operations to ensure data consistency

### API Route Structure
- Customer APIs under `/api/` (accounts, transactions, transfers, loans)
- Admin APIs under `/api/admin/` (dashboard-stats, customers, loans, reports)
- All routes check authentication via `getServerSession(authOptions)`
- Admin routes verify `session.user.role === 'employee'`

### State Management
- No global state management library - uses React hooks and NextAuth session
- Dashboard components auto-refresh every 30 seconds
- Form submissions use async/await with loading states

## Database Schema

Enums: account_type, account_status, card_type, card_status, loan_status, transaction_type

Key tables and relationships:
- Customers → Accounts (one-to-many)
- Accounts → Transactions (as from_account_id or to_account_id)
- Accounts → Cards (one-to-many)
- Customers → Loans (one-to-many)
- Employees → Loans (approved_by relationship)

## Critical Implementation Details

1. **Money Transfers**: Uses database transaction to ensure atomic updates to account balances
2. **Loan Approval**: Only employees can approve/reject loans via `/api/admin/loans/[loanId]`
3. **Advanced Reports**: Five complex SQL queries in `/api/admin/reports` for business insights
4. **Bill Payments**: Creates BillPayments record and deducts from account balance
5. **Account Numbers**: Generated as 'ACC' + padded customer_id (e.g., ACC0000000001)

## Environment Variables

Required in `.env.local`:
- DATABASE_URL (PostgreSQL connection string)
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- NEXTAUTH_URL
- NEXTAUTH_SECRET