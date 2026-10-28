# Kết quả xử lý phụ đề podcast — 27/10/2026

Phạm vi: kho phụ đề local của dự án HihiEnglish. Chưa thay đổi dữ liệu phụ đề production.

- Đã rà soát danh mục 146 video thuộc 8 kênh.
- 11 video đã có phụ đề: 10 video có lỗi đã được xử lý; video mẫu mgfBmnD04Q8 đã đạt kiểm tra từ lần trước.
- Tạo lại câu và bản dịch cho 9 video; sửa mốc từ cho 1 video mà không thay nội dung/bản dịch.
- Kiểm tra lại: 11/11 bản tải được qua FeaturedVideoService ở trạng thái READY; 3842 đoạn đều có bản dịch, tối đa 40 từ/đoạn, không còn lỗi mốc câu/từ theo bộ kiểm tra.
- 135 video chưa có phụ đề trên máy này: chưa có nội dung để đánh giá; không tự tạo thêm trong lần sửa này.
- Đối chiếu SHA-256: cả 11 bản phụ đề ban đầu còn nguyên. Không thay đổi thiết lập Premium, độ hiển thị video, tài khoản hoặc từ đã lưu.

| Kênh | Video | Số đoạn cũ → mới | Tối đa số từ mới | Cách xử lý |
| --- | --- | ---: | ---: | --- |
| VOA Learning English | Everyday Grammar Video: Ramen, A Popular Food in Japan (q4PkX8_xUYk) | 27 → 27 | 23 | Sửa mốc từ |
| BBC Learning English | Can your diet help you sleep better? ⏲️ 6 Minute English (pjFlVc-EDzc) | 76 → 78 | 36 | Tạo lại phụ đề và bản dịch |
| BBC Learning English | Why are so many young people around the world protesting? \| BBC Learning English from the News (JYjXBX5kVCg) | 99 → 100 | 33 | Tạo lại phụ đề và bản dịch |
| The British English Podcast | I Made a Better Way to Learn Phrasal Verbs (Hrz82VdlsxY) | 96 → 97 | 38 | Tạo lại phụ đề và bản dịch |
| Easy English | The Easy English Podcast #95 - 10 Different Ways to Say 'SORRY' \| Easy English 230 (6TqJ61h7OmQ) | 264 → 267 | 40 | Tạo lại phụ đề và bản dịch |
| Volka English | How to Introduce Yourself in English Naturally \| ENGLISH 101 (ErP_AKE3riY) | 174 → 174 | 36 | Tạo lại phụ đề và bản dịch |
| Volka English | The Easiest Way to Learn English? My Real Daily Routine \| POV Vlog (LTVk3yUb5Mg) | 257 → 271 | 38 | Tạo lại phụ đề và bản dịch |
| Volka English | A Day in China \| English Listening Practice (lxoMNDsktlY) | 545 → 546 | 32 | Tạo lại phụ đề và bản dịch |
| Volka English | I'll Talk About My Day. You Practice Your English (H5qcIEH1iVs) | 488 → 489 | 34 | Tạo lại phụ đề và bản dịch |
| The Diary Of A CEO | President Zelenskyy: I MUST Tell You The Truth About The War! They Found 500 Bodies! (5x9dkYIRb58) | 1536 → 1558 | 40 | Tạo lại phụ đề và bản dịch |

Kiểm thử: 104 kiểm thử backend và 6 kiểm thử công cụ bảo trì đã đạt; biên dịch TypeScript backend thành công.

[Báo cáo JSON đầy đủ](./podcast-subtitles-2026-10-27T13-46-53-374Z.json). Hướng dẫn chạy lại: [docs/podcast-subtitles.md](../docs/podcast-subtitles.md).
