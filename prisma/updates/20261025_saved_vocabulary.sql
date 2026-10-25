-- CreateTable
CREATE TABLE "saved_vocabulary_words" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "word_key" TEXT NOT NULL,
    "sense_key" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "phonetic" TEXT,
    "part_of_speech" TEXT,
    "definition" TEXT,
    "status" "VocabularyProgressStatus" NOT NULL DEFAULT 'LEARNING',
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "correct_count" INTEGER NOT NULL DEFAULT 0,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "lapses" INTEGER NOT NULL DEFAULT 0,
    "interval_days" INTEGER NOT NULL DEFAULT 0,
    "ease_factor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "next_review_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_reviewed_at" TIMESTAMP(3),
    "last_review_request_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_vocabulary_words_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_vocabulary_sources" (
    "id" TEXT NOT NULL,
    "word_id" TEXT NOT NULL,
    "source_key" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sentence" TEXT NOT NULL,
    "sentence_translation" TEXT NOT NULL,
    "start_time" DOUBLE PRECISION NOT NULL,
    "end_time" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_vocabulary_sources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "saved_vocabulary_words_user_id_next_review_at_idx" ON "saved_vocabulary_words"("user_id", "next_review_at");

-- CreateIndex
CREATE INDEX "saved_vocabulary_words_user_id_status_idx" ON "saved_vocabulary_words"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "saved_vocabulary_words_user_id_word_key_sense_key_key" ON "saved_vocabulary_words"("user_id", "word_key", "sense_key");

-- CreateIndex
CREATE INDEX "saved_vocabulary_sources_source_type_source_id_idx" ON "saved_vocabulary_sources"("source_type", "source_id");

-- CreateIndex
CREATE UNIQUE INDEX "saved_vocabulary_sources_word_id_source_key_key" ON "saved_vocabulary_sources"("word_id", "source_key");

-- AddForeignKey
ALTER TABLE "saved_vocabulary_words" ADD CONSTRAINT "saved_vocabulary_words_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_vocabulary_sources" ADD CONSTRAINT "saved_vocabulary_sources_word_id_fkey" FOREIGN KEY ("word_id") REFERENCES "saved_vocabulary_words"("id") ON DELETE CASCADE ON UPDATE CASCADE;

