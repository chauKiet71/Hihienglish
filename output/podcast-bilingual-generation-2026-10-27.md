# Phụ đề song ngữ podcast — 27/10/2026

**Trạng thái: đã hoàn tất 123/135 video mới; còn 12 video bị chặn ở khâu dịch do OpenAI API hết credits (HTTP 429: no credits remaining).**

- Tổng cộng 134/146 video trong kho local đã có phụ đề song ngữ hoàn chỉnh, gồm 11 bản có trước và 123 bản mới.
- 58.943 đoạn mới có tiếng Anh và tiếng Việt; tổng kho hoàn chỉnh có 62.785 đoạn.
- Kiểm tra toàn bộ bản hoàn chỉnh: tối đa 40 từ/đoạn; đoạn từ 8 từ trở lên không vượt 18 giây (thực tế tối đa 17,952 giây); không còn lỗi mốc câu chồng nhau, mốc từ ngoài câu/video, thời lượng không hợp lệ hoặc bản dịch trống.
- Bộ đọc FeaturedVideoService tải được cả 134 bản ở trạng thái READY. API local trên cổng 3004 xác nhận READY cho ba mẫu VOA, tập Luke dài 1.600 đoạn và tập CEO dài 2.226 đoạn.
- Đối chiếu SHA-256 xác nhận 11 bản phụ đề có trước không bị thay đổi.
- Cả 12 video còn lại đã có bản tiếng Anh với mốc thời gian và các điểm lưu tiến độ. Chỉ những phần có đủ bản dịch và đạt kiểm tra mới được đưa vào transcript-v3.json.
- Một lỗi mốc từ cuối vượt biên video đã được sửa và có kiểm thử hồi quy. Khoảng im lặng dài được giữ giữa hai câu; âm thanh lớn được chia từng phần với mốc cộng lại theo vị trí gốc.
- 111 kiểm thử backend và 10 kiểm thử công cụ bảo trì đều đạt; biên dịch TypeScript backend thành công.

## Kết quả theo kênh

| Kênh | Video mới hoàn tất | Video mới còn thiếu | Tổng bản song ngữ sẵn sàng |
| --- | ---: | ---: | ---: |
| Easy English | 19 | 0 | 20 |
| BBC Learning English | 18 | 0 | 20 |
| The British English Podcast | 19 | 0 | 20 |
| VOA Learning English | 19 | 0 | 20 |
| Luke's English Podcast | 14 | 6 | 14 |
| The Diary Of A CEO | 13 | 6 | 14 |
| TED | 20 | 0 | 20 |
| Volka English | 1 | 0 | 6 |

## 12 video cần dịch tiếp

| Video | Kênh | Đoạn tiếng Anh đã chuẩn bị | Tệp lô dịch đã lưu |
| --- | --- | ---: | ---: |
| Debating Skills in English 🗣️ (with Ray Addam) [996] (33S5rvjSONU) | Luke's English Podcast | 2005 | 0 |
| Testing My Friends on English Grammar / Irregular Verbs with Amber & Paul 🎯 [1003] (3Y5KpLXsMSQ) | Luke's English Podcast | 3123 | 0 |
| Episode 1000! 🎉 (7PH5cAxtF3A) | Luke's English Podcast | 3206 | 0 |
| I travelled alone in Vietnam 🇻🇳 Here's what happened [992] (JlWff3Opb9M) | Luke's English Podcast | 2620 | 0 |
| The Man Who Calls BS On AI: They’re LYING About AI, 2027 Is When It All Breaks! \| Ed Zitron (Lf5oqGOCRCM) | The Diary Of A CEO | 2414 | 1 |
| Andrew Huberman: The Real Reason You Can't Get Deep Sleep & Wake Up Exhausted (MGxcosNuC8k) | The Diary Of A CEO | 2038 | 49 |
| Sherlock Holmes & The Adventure of the Man with the Twisted Lip 🕵 [999] (NeaeHcwl1rQ) | Luke's English Podcast | 2449 | 0 |
| AI Experts Debate: The AI Labs Are Lying To Everyone, Is There A 99% Chance Of Human Extinction? (OhOmLqR5nN4) | The Diary Of A CEO | 2178 | 14 |
| Real English Learning Stories from Around the World 🌏 Listener Comments & Questions [1001] (a5lYa-U2fX4) | Luke's English Podcast | 2100 | 0 |
| Rick Rubin: The Only Skill That Matters Now Is The One Thing AI Can Never Steal! (a_GiFiHXJ6g) | The Diary Of A CEO | 2485 | 0 |
| Vanessa Van Edwards: The Conversation Habit That Makes Smart People Unlikable (q2cg1gEYWJQ) | The Diary Of A CEO | 2672 | 0 |
| No.1 Neuroscientist Reveals How To Unlock Superhuman Focus & Perfect Memory! - Dr. Sahar Yousef (yePLuwL3FbM) | The Diary Of A CEO | 2106 | 86 |

## Tệp kết quả

- [Gói phụ đề đã hoàn tất — 134 video, khoảng 14,15 MiB](./podcast-subtitles-ready-2026-10-27.zip). Chỉ chứa các transcript-v3.json đã đạt kiểm tra và manifest; không chứa khóa API hoặc audio nguồn.
- [Bản sao điểm tiến độ của 12 video còn thiếu — khoảng 6,62 MiB](./podcast-subtitles-pending-checkpoints-2026-10-27.zip).
- [Manifest, SHA-256 và danh sách đầy đủ](./podcast-bilingual-generation-2026-10-27.json). Cả hai gói ZIP đã được kiểm tra CRC.

## Tiếp tục sau khi bổ sung credits

Tài khoản API đang dùng tại api.openai.com đã trả lỗi hết credits. Cần bổ sung credits trên tài khoản đó; không cần gửi khóa qua chat. Sau đó chạy lại:

```powershell
node scripts/audit-podcast-subtitles.mjs --apply --include-missing --workers=3
```

Công cụ bỏ qua các bản đã hoàn tất và tiếp tục từ các điểm lưu hiện có. Không cần tạo lại 123 video đã xong.

## Phạm vi kiểm tra

Đây là dữ liệu local; chưa chuyển các tệp lên production. Thời gian lấy từ phụ đề nguồn hoặc nhận dạng âm thanh; kiểm tra cấu trúc được áp dụng trên toàn bộ bản đã hoàn tất. Đã xem phụ đề trên giao diện và phát được video gốc YouTube; trình phát nhúng báo lỗi kết nối trong phiên QA, nên chưa xác nhận phát/tua nhúng ở phiên đó. Không khẳng định đã nghe kiểm tra thủ công toàn bộ 102 giờ.

Các đoạn có bản dịch trùng nguyên văn đã được rà soát: đó là tên riêng, cách đánh vần, địa chỉ web, âm thanh tượng thanh hoặc ví dụ ngôn ngữ được giữ nguyên. Thiết lập Premium, độ hiển thị video và dữ liệu từ đã lưu không bị thay đổi bởi tác vụ tạo tệp.
