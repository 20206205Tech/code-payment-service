import * as readline from 'readline';
import { v4 as uuidv4 } from 'uuid';
import dataSource from './data-source';
import { PlanEntity } from './src/modules/payment/infrastructure/database/entities/plan.entity';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => rl.question(query, resolve));
};

async function main() {
  console.log('=== PLAN PAGINATION TEST DATA GENERATOR (temp2) ===');

  // 1. Khởi tạo kết nối DB
  console.log('Đang kết nối cơ sở dữ liệu...');
  await dataSource.initialize();
  console.log('Kết nối cơ sở dữ liệu thành công!');

  try {
    const planRepo = dataSource.getRepository(PlanEntity);

    // 2. Hỏi số lượng plan cần tạo
    const planCountInput = (
      await question('Số lượng gói cước muốn tạo thêm (mặc định: 15): ')
    ).trim();
    const numPlans = planCountInput ? parseInt(planCountInput, 10) : 15;

    console.log(`\nĐang tạo ${numPlans} gói cước mẫu...`);
    const now = new Date();

    const sampleFeatures = [
      ['Truy cập GPT-4', 'Xử lý văn bản', 'Phản hồi nhanh'],
      ['Sử dụng voice', 'Dịch thuật thông minh', 'Không giới hạn câu hỏi'],
      ['Hỗ trợ 24/7', 'Xử lý tài liệu riêng', 'Phân tích dữ liệu chuyên sâu'],
      ['Ưu tiên xử lý', 'Xuất báo cáo PDF', 'Tùy chỉnh nhân vật AI'],
    ];

    for (let i = 1; i <= numPlans; i++) {
      const plan = new PlanEntity();
      plan.id = uuidv4();

      // Tạo tên gói cước tăng dần
      plan.name = `VIP Test ${i.toString().padStart(2, '0')}`;

      // Luân phiên thời gian hạn định: 1, 3, 6, 12 tháng
      const durations = [1, 3, 6, 12];
      plan.durationMonths = durations[(i - 1) % durations.length];

      // Giá cước tăng dần theo thời hạn và số thứ tự
      plan.price = 50000 * plan.durationMonths + i * 5000;

      // Trạng thái hoạt động
      plan.isActive = true;

      // Chọn ngẫu nhiên/tuần tự danh sách tính năng mẫu
      plan.features = sampleFeatures[(i - 1) % sampleFeatures.length];

      // Giãn cách thời gian tạo một chút để phân biệt
      const planTime = new Date(now.getTime() - (numPlans - i) * 60 * 1000);
      plan.createdAt = planTime;
      plan.updatedAt = planTime;
      plan.version = 1;

      await planRepo.save(plan);
      console.log(
        `-> Đã tạo gói: '${plan.name}' - ${plan.durationMonths} tháng - Giá: ${plan.price} VND`,
      );
    }

    console.log(`\n=== ĐÃ TẠO THÀNH CÔNG ${numPlans} GÓI CƯỚC MẪU ===`);
    console.log(
      `Tổng số gói cước hiện có trong cơ sở dữ liệu: ${await planRepo.count()}`,
    );
  } catch (error) {
    console.error('\n[LỖI] Tạo dữ liệu thất bại:', error);
  } finally {
    await dataSource.destroy();
    rl.close();
  }
}

main();
