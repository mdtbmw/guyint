import type { SVGProps } from "react";

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        {/* Stylized "I" for Intuition */}
        <path d="M12 4V20" strokeWidth="3" /> 
        {/* Spark for insight */}
        <path d="M12 4L14 2" />
        <path d="M12 4L10 2" />
        <path d="M12 4L14 6" />
        <path d="M12 4L10 6" />
    </svg>
  );
}
