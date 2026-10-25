import { BookOpen, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import './SavedVocabularyHome.css';

export default function SavedVocabularyHome() {
  return (
    <section className="saved-vocabulary-home px-4 mb-6">
      <h2 className="mb-3 font-bold text-gray-900 dark:text-white">
        Từ vựng của bạn
      </h2>
      <Link to="/tu-vung" className="saved-vocabulary-promo">
        <span className="saved-vocabulary-promo__icon" aria-hidden="true">
          <BookOpen strokeWidth={2.2} />
        </span>
        <div className="saved-vocabulary-promo__content">
          <p className="saved-vocabulary-promo__title">
            Giữ lại những từ bạn muốn nhớ
          </p>
          <p className="saved-vocabulary-promo__description">
            Lưu từ khi học podcast và ôn lại bất cứ lúc nào.
          </p>
        </div>
        <span className="saved-vocabulary-promo__arrow" aria-hidden="true">
          <ChevronRight strokeWidth={2.8} />
        </span>
      </Link>
    </section>
  );
}
