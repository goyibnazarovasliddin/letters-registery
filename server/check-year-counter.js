/**
 * YearCounter tekshirish skripti.
 *
 * Ishlatish (server papkasida):
 *   node check-year-counter.js
 *
 * Nima qiladi:
 *   - Har bir yil uchun YearCounter.lastSequence qiymatini oladi.
 *   - O'sha yildagi REGISTERED xatlarning haqiqiy eng katta tartib raqamini (/N) hisoblaydi.
 *   - Ikkalasini solishtiradi va mos / mos emasligini tushunarli ko'rsatadi.
 *
 * Git'ga qo'shilmaydi — faqat tekshirish uchun.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// letterNumber dan YILLIK COUNTER tartib raqamini ajratib oladi.
// Format: "<indexCode>/<seq>"        -> counter shu bo'yicha yuradi, seq qaytadi.
//         "<indexCode>/<seq>-<N>"    -> eski sanaga qo'shilgan xat, counter'ni
//                                       ishlatmaydi -> null qaytadi (e'tiborga olinmaydi).
function extractSequence(letterNumber) {
  if (!letterNumber) return null;
  const s = String(letterNumber);
  // Faqat oxiri "/raqam" bilan tugaydiganlar (suffikssiz) counter raqami hisoblanadi.
  const m = s.match(/\/(\d+)$/);
  return m ? parseInt(m[1], 10) : null;
}

async function main() {
  console.log('');
  console.log('==================================================');
  console.log('   YearCounter tekshiruvi');
  console.log('==================================================');
  console.log('');

  const counters = await prisma.yearCounter.findMany({ orderBy: { year: 'asc' } });
  const letters = await prisma.letter.findMany({
    where: { status: 'REGISTERED', letterNumber: { not: null } },
    select: { letterNumber: true, letterDate: true },
  });

  // Xatlarni yil bo'yicha guruhlash (letterDate ning yili bo'yicha).
  const byYear = {};
  for (const l of letters) {
    const year = parseInt(String(l.letterDate).split('-')[0], 10);
    if (Number.isNaN(year)) continue;
    if (!byYear[year]) byYear[year] = { count: 0, maxSeq: 0, sequences: [] };
    const seq = extractSequence(l.letterNumber);
    byYear[year].count++;
    if (seq !== null) {
      byYear[year].sequences.push(seq);
      if (seq > byYear[year].maxSeq) byYear[year].maxSeq = seq;
    }
  }

  // Counter bor, lekin xat yo'q bo'lgan yillarni ham hisobga olish uchun
  // barcha yillar ro'yxatini yig'amiz.
  const allYears = new Set([
    ...counters.map((c) => c.year),
    ...Object.keys(byYear).map((y) => parseInt(y, 10)),
  ]);
  const sortedYears = [...allYears].sort((a, b) => a - b);

  if (sortedYears.length === 0) {
    console.log('  Hech qanday ma\'lumot topilmadi (YearCounter ham, xat ham yo\'q).');
    console.log('');
    await prisma.$disconnect();
    return;
  }

  let problemCount = 0;

  for (const year of sortedYears) {
    const counter = counters.find((c) => c.year === year);
    const counterVal = counter ? counter.lastSequence : null;
    const stat = byYear[year] || { count: 0, maxSeq: 0, sequences: [] };

    console.log(`  YIL: ${year}`);
    console.log(`    YearCounter.lastSequence : ${counterVal === null ? 'YO\'Q (qator mavjud emas)' : counterVal}`);
    console.log(`    Haqiqiy xatlar soni      : ${stat.count}`);
    console.log(`    Haqiqiy eng katta /N     : ${stat.count > 0 ? stat.maxSeq : '—'}`);

    // Tahlil
    let verdict;
    if (counterVal === null && stat.count > 0) {
      verdict = 'MUAMMO: Counter qatori yo\'q, lekin xatlar bor. '
        + `Keyingi yangi xat /1 dan boshlanadi va mavjud raqamlar bilan to'qnashadi. `
        + `Tuzatish: YearCounter ga { year: ${year}, lastSequence: ${stat.maxSeq} } qo'shish kerak.`;
      problemCount++;
    } else if (counterVal === null && stat.count === 0) {
      verdict = 'OK: na counter, na xat — muammo yo\'q.';
    } else if (stat.count === 0) {
      verdict = `OK: counter bor (${counterVal}), bu yilda xat yo'q. Keyingi xat /${counterVal + 1} bo'ladi.`;
    } else if (counterVal === stat.maxSeq) {
      verdict = 'OK: counter haqiqiy eng katta raqamga to\'liq mos.';
    } else if (counterVal > stat.maxSeq) {
      verdict = `OGOHLANTIRISH: counter (${counterVal}) haqiqiy maxdan (${stat.maxSeq}) katta. `
        + `Sabab odatda o'chirilgan xatlar. Bu xavfsiz — raqamlar to'qnashmaydi, faqat oraliq raqamlar o'tkazib yuborilgan.`;
    } else {
      // counterVal < stat.maxSeq
      verdict = `MUAMMO: counter (${counterVal}) haqiqiy maxdan (${stat.maxSeq}) kichik. `
        + `Keyingi xatlar mavjud raqamlar bilan TO'QNASHADI. `
        + `Tuzatish: YearCounter.lastSequence ni kamida ${stat.maxSeq} ga ko'tarish kerak.`;
      problemCount++;
    }
    console.log(`    XULOSA                   : ${verdict}`);

    // Dublikat /N borligini ham tekshiramiz (bir yilda bir xil tartib raqami 2 marta).
    const seqCounts = {};
    for (const s of stat.sequences) seqCounts[s] = (seqCounts[s] || 0) + 1;
    const dups = Object.entries(seqCounts).filter(([, c]) => c > 1);
    if (dups.length > 0) {
      problemCount++;
      console.log(`    DUBLIKAT /N              : MUAMMO — quyidagi tartib raqamlari takrorlangan: `
        + dups.map(([s, c]) => `${s} (${c} marta)`).join(', '));
    }

    console.log('');
  }

  console.log('--------------------------------------------------');
  if (problemCount === 0) {
    console.log('  NATIJA: Hammasi joyida. YearCounter to\'g\'ri, hech qanday tuzatish kerak emas.');
  } else {
    console.log(`  NATIJA: ${problemCount} ta muammo topildi (yuqorida "MUAMMO" deb belgilangan).`);
  }
  console.log('--------------------------------------------------');
  console.log('');

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('');
  console.error('  XATOLIK yuz berdi:');
  console.error('  ', e.message || e);
  console.error('');
  console.error('  Eng ko\'p uchraydigan sabab: YearCounter jadvali bazada mavjud emas.');
  console.error('  Bu holda avval migration ishga tushiring:  npx prisma migrate deploy');
  console.error('');
  await prisma.$disconnect();
  process.exit(1);
});
