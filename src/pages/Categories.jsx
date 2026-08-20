import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { CardSkeleton } from '../components/States';
import { getCategories } from '../api/misc';

export default function Categories() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout>
      <h1 className="font-display font-bold text-xl mb-1">What work do you need done?</h1>
      <p className="text-sm text-ink-500 mb-5">Pick a category and KamWala AI will ask what it needs to know.</p>

      {loading && <CardSkeleton count={4} />}

      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {categories.map((c) => {
            const Icon = Icons[c.icon] || Icons.Wrench;
            return (
              <button
                key={c._id}
                onClick={() => navigate(`/categories/${c._id}`)}
                className="flex flex-col items-center gap-2.5 bg-white border border-cloud-200 rounded-card p-5 hover:border-brand-300 hover:bg-cloud-50 transition-colors text-center"
              >
                <span className="h-11 w-11 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center">
                  <Icon size={20} />
                </span>
                <span className="text-sm font-medium leading-tight">{c.name}</span>
              </button>
            );
          })}
          <button
            onClick={() => navigate('/ai-chat', { state: { category: 'Other Work' } })}
            className="flex flex-col items-center gap-2.5 bg-cloud-50 border border-dashed border-cloud-200 rounded-card p-5 hover:border-brand-300 transition-colors text-center"
          >
            <span className="h-11 w-11 rounded-full bg-cloud-100 text-ink-700 flex items-center justify-center">
              <Icons.HelpCircle size={20} />
            </span>
            <span className="text-sm font-medium leading-tight">Something else</span>
          </button>
        </div>
      )}
    </AppLayout>
  );
}
