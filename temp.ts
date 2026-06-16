import * as readline from 'readline';
import { v4 as uuidv4 } from 'uuid';
import dataSource from './data-source';
import { SubscriptionEntity } from './src/modules/payment/infrastructure/database/entities/subscription.entity';
import { TransactionEntity } from './src/modules/payment/infrastructure/database/entities/transaction.entity';
import { PlanEntity } from './src/modules/payment/infrastructure/database/entities/plan.entity';
import { SubscriptionStatus } from './src/modules/payment/domain/value-objects/subscription-status';
import { PaymentStatus } from './src/modules/payment/domain/value-objects/payment-status';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => rl.question(query, resolve));
};

async function main() {
  console.log('=== PAYMENT PAGINATION TEST DATA GENERATOR ===');

  // 1. Khởi tạo kết nối DB
  console.log('Đang kết nối cơ sở dữ liệu...');
  await dataSource.initialize();
  console.log('Kết nối cơ sở dữ liệu thành công!');

  try {
    const subRepo = dataSource.getRepository(SubscriptionEntity);
    const txRepo = dataSource.getRepository(TransactionEntity);
    const planRepo = dataSource.getRepository(PlanEntity);

    // 2. Gợi ý User ID
    const existingSubs = await subRepo
      .createQueryBuilder('sub')
      .select('DISTINCT sub.userId', 'userId')
      .getRawMany();
    const userIds = existingSubs.map((s) => s.userId).filter(Boolean);

    console.log('\nCác user_id hiện có trong cơ sở dữ liệu:');
    userIds.forEach((uid, idx) => {
      console.log(`[${idx + 1}] ${uid}`);
    });
    console.log('[0] Tạo user_id mới');

    const choice = (await question('\nChọn số hoặc nhập user_id mới: ')).trim();
    let userId = '';
    if (/^\d+$/.test(choice)) {
      const val = parseInt(choice, 10);
      if (val >= 1 && val <= userIds.length) {
        userId = userIds[val - 1];
      } else {
        userId = (await question('Nhập user_id mới: ')).trim();
      }
    } else {
      userId = choice ? choice : 'user_default';
    }

    if (!userId) {
      userId = 'user_default';
    }
    console.log(`Sử dụng user_id: '${userId}'`);

    // 3. Nhập số lượng giao dịch muốn tạo
    const txCountInput = (
      await question('Số lượng giao dịch muốn tạo (mặc định: 25): ')
    ).trim();
    const numTransactions = txCountInput ? parseInt(txCountInput, 10) : 25;

    // 4. Tìm kiếm hoặc tạo một Gói cước (Plan) hợp lệ
    let plan = await planRepo.findOne({ where: { isActive: true } });
    if (!plan) {
      console.log(
        'Không tìm thấy Plan nào hoạt động. Đang tạo Plan mặc định...',
      );
      plan = new PlanEntity();
      plan.id = uuidv4();
      plan.name = 'VIP 1 Tháng';
      plan.durationMonths = 1;
      plan.price = 99000;
      plan.isActive = true;
      plan.createdAt = new Date();
      plan.updatedAt = new Date();
      plan.version = 1;
      await planRepo.save(plan);
      console.log(`-> Đã tạo Plan mặc định: '${plan.name}' (ID: ${plan.id})`);
    } else {
      console.log(`-> Sử dụng Plan hiện có: '${plan.name}' (ID: ${plan.id})`);
    }

    // 5. Tìm hoặc tạo/cập nhật Subscription cho User
    let subscription = await subRepo.findOne({ where: { userId } });
    const periodStart = new Date();
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + plan.durationMonths);

    if (!subscription) {
      console.log('User chưa có subscription. Đang tạo mới...');
      subscription = new SubscriptionEntity();
      subscription.id = uuidv4();
      subscription.userId = userId;
      subscription.planId = plan.id;
      subscription.periodStart = periodStart;
      subscription.periodEnd = periodEnd;
      subscription.status = SubscriptionStatus.ACTIVE;
      subscription.createdAt = new Date();
      subscription.updatedAt = new Date();
      subscription.version = 1;
    } else {
      console.log(
        'User đã có subscription. Đang cập nhật trạng thái ACTIVE và thời hạn...',
      );
      subscription.planId = plan.id;
      subscription.periodStart = periodStart;
      subscription.periodEnd = periodEnd;
      subscription.status = SubscriptionStatus.ACTIVE;
      subscription.updatedAt = new Date();
    }
    await subRepo.save(subscription);
    console.log(
      `-> Đã kích hoạt VIP: từ ${subscription.periodStart.toLocaleDateString()} đến ${subscription.periodEnd.toLocaleDateString()}`,
    );

    // 6. Tạo danh sách các giao dịch (Transactions) để test phân trang
    console.log(`\nĐang tạo ${numTransactions} giao dịch...`);
    const now = new Date();

    for (let i = 0; i < numTransactions; i++) {
      const tx = new TransactionEntity();
      tx.id = uuidv4();
      tx.userId = userId;
      tx.subscriptionId = subscription.id;
      tx.planId = plan.id;
      tx.baseAmount = plan.price;
      tx.discountAmount = 0;
      tx.finalAmount = plan.price;
      tx.paymentMethod = 'vnpay';
      tx.transactionRef = `REF_TEST_${Date.now()}_${i}`;

      // Chia trạng thái thành công/thất bại ngẫu nhiên
      tx.paymentStatus =
        i % 5 === 0 ? PaymentStatus.FAILED : PaymentStatus.SUCCESS;

      // Giãn cách thời gian tạo giao dịch (cách nhau 2 giờ mỗi giao dịch) để hiển thị lịch sử chuẩn
      const txTime = new Date(
        now.getTime() - (numTransactions - i) * 2 * 60 * 60 * 1000,
      );
      tx.createdAt = txTime;
      tx.updatedAt = txTime;
      tx.paidAt = tx.paymentStatus === PaymentStatus.SUCCESS ? txTime : null;
      tx.providerTransactionId =
        tx.paymentStatus === PaymentStatus.SUCCESS
          ? `VNP_${Date.now()}_${i}`
          : null;
      tx.paymentMetadata = null;
      tx.version = 1;

      await txRepo.save(tx);
    }

    console.log(`-> Đã tạo thành công ${numTransactions} giao dịch.`);
    console.log('\n=== ĐÃ HOÀN THÀNH SINH DỮ LIỆU TEST PHÂN TRANG ===');
    console.log(`User ID: ${userId}`);
    console.log(
      `VIP Status: ACTIVE (Từ ${subscription.periodStart.toLocaleDateString()} đến ${subscription.periodEnd.toLocaleDateString()})`,
    );
  } catch (error) {
    console.error('\n[LỖI] Thao tác thất bại:', error);
  } finally {
    await dataSource.destroy();
    rl.close();
  }
}

main();
