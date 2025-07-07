"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TablePagination from "@mui/material/TablePagination";

// Mock conversation data structure
interface Conversation {
  code: string;
  name: string;
  responseNumber: number;
  status: "Closed" | "On Going" | "Pending";
  customer: string;
  startDate: string;
  customerResponse: string;
  endDate: string;
  teamResponse: string;
}

// Mock filters for conversations
interface ConversationFilters {
  code: string;
  name: string;
  status: string;
  customer: string;
  startDay: string;
  startMonth: string;
  startYear: string;
}

function formatDate(dateString: string): string {
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
}

function formatTime(timeString: string): string {
  return timeString || "-";
}

export default function ConversationTable({ filters }: { filters: ConversationFilters }) {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [conversationData, setConversationData] = useState<Conversation[]>([]);

  const getStatusColor = (status: string) => {
    const base = "px-3 py-1 rounded-full text-xs font-semibold";
    switch (status) {
      case "Closed":
        return `${base} bg-lightGreen text-darkBlue`;
      case "On Going":
        return `${base} bg-lightOrange text-darkRed`;
      case "Pending":
        return `${base} bg-lightYellow text-darkRed`;
      default:
        return base;
    }
  };

  const filteredConversations = conversationData.filter((c) => {
    const matchCode = !filters.code || c.code === filters.code;
    const matchName = !filters.name || c.name === filters.name;
    const matchStatus = !filters.status || c.status === filters.status;
    const matchCustomer = !filters.customer || c.customer === filters.customer;

    const [year, month, day] = c.startDate.split("-");
    const matchDay = !filters.startDay || filters.startDay === day;
    const matchMonth = !filters.startMonth || filters.startMonth === month;
    const matchYear = !filters.startYear || filters.startYear === year;

    return (
      matchCode &&
      matchName &&
      matchStatus &&
      matchCustomer &&
      matchDay &&
      matchMonth &&
      matchYear
    );
  });

  const paginatedConversations = filteredConversations.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const logoWhite = "#F5F7FA";

  // Mock data - replace with actual API call
  useEffect(() => {
    // Simulating API call with mock data
    const mockData: Conversation[] = [
      {
        code: "SOV-2024-0158",
        name: "ANYPAY - aku IP Whitelist 54.179.114.128 #refbwÿ",
        responseNumber: 8,
        status: "Closed",
        customer: "ANYPAY COMPANY LIMITED",
        startDate: "2024-01-07",
        customerResponse: "08:50 AM",
        endDate: "2024-01-07",
        teamResponse: "08:50 AM"
      },
      {
        code: "SOV-2024-0156",
        name: "ANYPAY - aku IP Whitelist 54.179.114.128 #refbwÿ",
        responseNumber: 2,
        status: "On Going",
        customer: "ANYPAY COMPANY LIMITED",
        startDate: "2024-01-07",
        customerResponse: "08:59 AM",
        endDate: "-",
        teamResponse: "-"
      },
      {
        code: "SOV-2024-0157",
        name: "High Latency in Core API Services",
        responseNumber: 1,
        status: "On Going",
        customer: "LEARN EDUCATION CO., LTD.",
        startDate: "2024-01-07",
        customerResponse: "09:04 AM",
        endDate: "-",
        teamResponse: "-"
      },
      {
        code: "SOV-2024-0158",
        name: "All Services Unavailable - Incident Declared",
        responseNumber: 1,
        status: "Closed",
        customer: "MEIKO TRANS (THAILAND) CO., LTD.",
        startDate: "2024-01-07",
        customerResponse: "08:50 AM",
        endDate: "2024-01-07",
        teamResponse: "08:50 AM"
      },
      {
        code: "SOV-2024-0158",
        name: "All Services Unavailable - Incident Declared",
        responseNumber: 2,
        status: "Pending",
        customer: "MEIKO TRANS (THAILAND) CO., LTD.",
        startDate: "2024-01-07",
        customerResponse: "08:50 AM",
        endDate: "2024-01-07",
        teamResponse: "08:50 AM"
      },
      {
        code: "SOV-2024-0158",
        name: "All Services Unavailable - Incident Declared",
        responseNumber: 3,
        status: "On Going",
        customer: "MEIKO TRANS (THAILAND) CO., LTD.",
        startDate: "2024-01-07",
        customerResponse: "08:00 AM",
        endDate: "-",
        teamResponse: "-"
      },
      {
        code: "SOV-2023-8844",
        name: "High CPU Usage on Production Node",
        responseNumber: 1,
        status: "On Going",
        customer: "UNITED TELECOM SALES & SERVICES CO., LTD.",
        startDate: "2024-01-07",
        customerResponse: "12:58 PM",
        endDate: "-",
        teamResponse: "-"
      },
      {
        code: "SOV-2023-8743",
        name: "Intermittent Sync Issue Between Services",
        responseNumber: 1,
        status: "On Going",
        customer: "UNITY SOFT COMPANY LIMITED",
        startDate: "2024-01-07",
        customerResponse: "01:50 PM",
        endDate: "-",
        teamResponse: "-"
      },
      {
        code: "SOV-2023-1222",
        name: "Slow Response Time on Non-Critical API",
        responseNumber: 1,
        status: "On Going",
        customer: "UOB KAY HIAN SECURITIES (THAILAND) PUBLIC COMPANY LIMITED",
        startDate: "2024-01-07",
        customerResponse: "03:50 AM",
        endDate: "-",
        teamResponse: "-"
      },
      {
        code: "SOV-2024-0023",
        name: "Log File Rotation Not Triggering on Time",
        responseNumber: 5,
        status: "On Going",
        customer: "WAAN EXCHANGE CO., LTD.",
        startDate: "2024-01-07",
        customerResponse: "06:50 PM",
        endDate: "-",
        teamResponse: "-"
      }
    ];
    
    setConversationData(mockData);
  }, []);

  return (
    <div className="w-full overflow-x-auto h-full rounded-md bg-black bg-opacity-10">
      <div className="min-w-[1200px]">
        <table className="w-full text-left text-sm text-white table-auto">
          <thead className="sticky top-0 z-10 bg-logoBlack bg-opacity-10 backdrop-blur-md border-b border-gray-600">
            <tr>
              <th className="px-4 py-2 whitespace-nowrap">Code</th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2 text-center">Response Number</th>
              <th className="px-4 py-2 text-center">Status</th>
              <th className="px-4 py-2">Customer</th>
              <th className="px-4 py-2 whitespace-nowrap">Start Date</th>
              <th className="px-4 py-2 text-center">Customer Response</th>
              <th className="px-4 py-2 whitespace-nowrap">End Date</th>
              <th className="px-4 py-2 text-center">Team Response</th>
            </tr>
          </thead>
          <tbody>
            {paginatedConversations.map((c, idx) => (
              <tr 
                key={idx} 
                className="border-b border-gray-700 hover:bg-white hover:bg-opacity-10 cursor-pointer transition-colors h-12"
                onClick={() => router.push(`/conversation/${c.code}`)}
              >
                <td className="px-4 py-2 whitespace-nowrap">{c.code}</td>
                <td className="px-4 py-2">{c.name}</td>
                <td className="px-4 py-2 text-center">{c.responseNumber}</td>
                <td className="px-4 py-2 text-center">
                  <span className={getStatusColor(c.status)}>
                    {c.status}
                  </span>
                </td>
                <td className="px-4 py-2">{c.customer}</td>
                <td className="px-4 py-2 whitespace-nowrap">
                  {formatDate(c.startDate)}
                </td>
                <td className="px-4 py-2 text-center">
                  {formatTime(c.customerResponse)}
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  {c.endDate !== "-" ? formatDate(c.endDate) : "-"}
                </td>
                <td className="px-4 py-2 text-center">
                  {formatTime(c.teamResponse)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <TablePagination
          component="div"
          count={filteredConversations.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 20, 25]}
          sx={{
            ".MuiTablePagination-toolbar": {
              color: logoWhite,
            },
            ".MuiTablePagination-selectLabel": {
              color: logoWhite,
            },
            ".MuiTablePagination-input": {
              color: logoWhite,
            },
            ".MuiTablePagination-actions svg": {
              color: logoWhite,
            },
            ".MuiSelect-icon": {
              color: logoWhite,
            },
          }}
        />
      </div>
    </div>
  );
}