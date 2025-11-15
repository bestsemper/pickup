export default function SunIcon({ className, color }: { className?: string; color?: string }) {
  return (
    <svg 
      className={className}
      width="20" 
      height="20" 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="4" stroke={color || "currentColor"} strokeWidth="2" />
      <path 
        d="M12 2V4M12 20V22M4 12H2M6.31412 6.31412L4.8999 4.8999M17.6859 6.31412L19.1001 4.8999M6.31412 17.69L4.8999 19.1042M17.6859 17.69L19.1001 19.1042M22 12H20" 
        stroke={color || "currentColor"} 
        strokeWidth="2" 
        strokeLinecap="round"
      />
    </svg>
  );
}
