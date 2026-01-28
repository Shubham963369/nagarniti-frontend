import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { formatCurrency, formatDate } from "./utils";

// ============================================
// FUNDS REPORTS
// ============================================

export function generateFundsPDF(funds: any[], wardName: string) {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(18);
  doc.text(`Fund Allocation Report`, 14, 20);

  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(`Ward: ${wardName}`, 14, 28);
  doc.text(`Generated: ${formatDate(new Date().toISOString())}`, 14, 34);

  // Summary
  const totalFunds = funds.reduce((sum, f) => sum + parseFloat(f.amount || 0), 0);
  const usedFunds = funds.reduce((sum, f) => sum + parseFloat(f.usedAmount || 0), 0);
  const availableFunds = totalFunds - usedFunds;

  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text(`Total Funds: ${formatCurrency(totalFunds)}`, 14, 44);
  doc.text(`Used: ${formatCurrency(usedFunds)}`, 80, 44);
  doc.text(`Available: ${formatCurrency(availableFunds)}`, 140, 44);

  // Table
  const tableData = funds.map((fund) => [
    fund.source || "-",
    fund.financialYear || "-",
    formatCurrency(parseFloat(fund.amount || 0)),
    formatCurrency(parseFloat(fund.usedAmount || 0)),
    formatCurrency(parseFloat(fund.amount || 0) - parseFloat(fund.usedAmount || 0)),
    fund.allocatedDate ? formatDate(fund.allocatedDate) : "-",
  ]);

  autoTable(doc, {
    startY: 52,
    head: [["Source", "Financial Year", "Amount", "Used", "Available", "Allocated Date"]],
    body: tableData,
    theme: "striped",
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 9 },
  });

  doc.save(`funds-report-${wardName.toLowerCase().replace(/\s+/g, "-")}.pdf`);
}

export function generateFundsExcel(funds: any[], wardName: string) {
  const data = funds.map((fund) => ({
    Source: fund.source || "-",
    "Financial Year": fund.financialYear || "-",
    Amount: parseFloat(fund.amount || 0),
    "Used Amount": parseFloat(fund.usedAmount || 0),
    "Available Amount": parseFloat(fund.amount || 0) - parseFloat(fund.usedAmount || 0),
    "Allocated Date": fund.allocatedDate ? formatDate(fund.allocatedDate) : "-",
    Description: fund.description || "-",
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Funds");

  XLSX.writeFile(wb, `funds-report-${wardName.toLowerCase().replace(/\s+/g, "-")}.xlsx`);
}

// ============================================
// PROJECTS REPORTS
// ============================================

export function generateProjectsPDF(projects: any[], wardName: string) {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(18);
  doc.text(`Projects Report`, 14, 20);

  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(`Ward: ${wardName}`, 14, 28);
  doc.text(`Generated: ${formatDate(new Date().toISOString())}`, 14, 34);

  // Summary
  const stats = {
    total: projects.length,
    completed: projects.filter((p) => p.status === "completed").length,
    inProgress: projects.filter((p) => p.status === "in_progress").length,
    proposed: projects.filter((p) => p.status === "proposed").length,
    totalCost: projects.reduce((sum, p) => sum + parseFloat(p.estimatedCost || 0), 0),
  };

  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text(`Total: ${stats.total}`, 14, 44);
  doc.text(`Completed: ${stats.completed}`, 50, 44);
  doc.text(`In Progress: ${stats.inProgress}`, 90, 44);
  doc.text(`Total Cost: ${formatCurrency(stats.totalCost)}`, 140, 44);

  // Table
  const tableData = projects.map((project) => [
    project.title || "-",
    project.status?.replace("_", " ") || "-",
    project.location || "-",
    formatCurrency(parseFloat(project.estimatedCost || 0)),
    project.fundSource || "-",
    `${project.percentComplete || 0}%`,
  ]);

  autoTable(doc, {
    startY: 52,
    head: [["Title", "Status", "Location", "Est. Cost", "Fund Source", "Progress"]],
    body: tableData,
    theme: "striped",
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 25 },
      2: { cellWidth: 35 },
      3: { cellWidth: 30 },
      4: { cellWidth: 25 },
      5: { cellWidth: 20 },
    },
  });

  doc.save(`projects-report-${wardName.toLowerCase().replace(/\s+/g, "-")}.pdf`);
}

export function generateProjectsExcel(projects: any[], wardName: string) {
  const data = projects.map((project) => ({
    Title: project.title || "-",
    Description: project.description || "-",
    Status: project.status?.replace("_", " ") || "-",
    Location: project.location || "-",
    "Estimated Cost": parseFloat(project.estimatedCost || 0),
    "Fund Source": project.fundSource || "-",
    "Progress %": project.percentComplete || 0,
    "Start Date": project.startDate ? formatDate(project.startDate) : "-",
    "End Date": project.endDate ? formatDate(project.endDate) : "-",
    "Created At": formatDate(project.createdAt),
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Projects");

  XLSX.writeFile(wb, `projects-report-${wardName.toLowerCase().replace(/\s+/g, "-")}.xlsx`);
}

// ============================================
// GRIEVANCES REPORTS
// ============================================

export function generateGrievancesPDF(grievances: any[], wardName: string) {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(18);
  doc.text(`Grievances Report`, 14, 20);

  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(`Ward: ${wardName}`, 14, 28);
  doc.text(`Generated: ${formatDate(new Date().toISOString())}`, 14, 34);

  // Summary
  const stats = {
    total: grievances.length,
    resolved: grievances.filter((g) => g.status === "resolved").length,
    pending: grievances.filter((g) => !["resolved", "rejected"].includes(g.status)).length,
    rejected: grievances.filter((g) => g.status === "rejected").length,
  };

  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text(`Total: ${stats.total}`, 14, 44);
  doc.text(`Resolved: ${stats.resolved}`, 50, 44);
  doc.text(`Pending: ${stats.pending}`, 90, 44);
  doc.text(`Rejected: ${stats.rejected}`, 130, 44);

  // Table
  const tableData = grievances.map((g) => [
    g.title || "-",
    g.category || "-",
    g.status?.replace("_", " ") || "-",
    g.location || "-",
    formatDate(g.createdAt),
    g.user?.name || "-",
  ]);

  autoTable(doc, {
    startY: 52,
    head: [["Title", "Category", "Status", "Location", "Date", "Submitted By"]],
    body: tableData,
    theme: "striped",
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 8 },
  });

  doc.save(`grievances-report-${wardName.toLowerCase().replace(/\s+/g, "-")}.pdf`);
}

export function generateGrievancesExcel(grievances: any[], wardName: string) {
  const data = grievances.map((g) => ({
    Title: g.title || "-",
    Description: g.description || "-",
    Category: g.category || "-",
    Status: g.status?.replace("_", " ") || "-",
    Location: g.location || "-",
    "Submitted By": g.user?.name || "-",
    Upvotes: g.upvoteCount || 0,
    Downvotes: g.downvoteCount || 0,
    "Admin Response": g.adminResponse || "-",
    "Created At": formatDate(g.createdAt),
    "Resolved At": g.resolvedAt ? formatDate(g.resolvedAt) : "-",
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Grievances");

  XLSX.writeFile(wb, `grievances-report-${wardName.toLowerCase().replace(/\s+/g, "-")}.xlsx`);
}
