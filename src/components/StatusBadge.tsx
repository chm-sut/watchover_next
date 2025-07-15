interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  // Map actual JIRA statuses to simplified statuses
  const getSimplifiedStatus = (status: string) => {
    const closedStatuses = ['Closed', 'Resolved', 'Done'];
    return closedStatuses.includes(status) ? 'Closed' : 'Ongoing';
  };

  const simplifiedStatus = getSimplifiedStatus(status);

  const getBadgeColor = (status: string) => {
    switch (status) {
      case 'Closed':
        return 'bg-lightGreen text-darkBlue';
      case 'Ongoing':
        return 'bg-lightOrange text-darkRed';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getBadgeColor(simplifiedStatus)}`}>
      {simplifiedStatus}
    </span>
  );
}