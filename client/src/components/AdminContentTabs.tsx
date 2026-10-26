import { NavLink } from 'react-router-dom';

export default function AdminContentTabs() {
  return (
    <nav
      aria-label="Loại nội dung"
      className="mb-6 flex gap-2 border-b border-gray-200 pb-3"
    >
      {[
        ['/admin/content', 'Bài học Khám phá'],
        ['/admin/content/podcasts', 'Podcast'],
      ].map(([to, label]) => (
        <NavLink
          key={to}
          to={to}
          end
          className={({ isActive }) =>
            `rounded-lg px-4 py-2 text-sm font-semibold ${isActive ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
