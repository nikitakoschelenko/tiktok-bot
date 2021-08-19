/**
 * Получение нужного склонения числа
 * @param amount Число
 * @param forms Массив форм склонения (один, два, много)
 */
export function pluralize(
  amount: number,
  forms: [string, string, string]
): string {
  const rule: Intl.LDMLPluralRule = new Intl.PluralRules('ru-RU').select(
    amount
  );

  const rules: Record<Intl.LDMLPluralRule, string> = {
    zero: forms[2],
    one: forms[0],
    two: forms[1],
    few: forms[1],
    many: forms[2],
    other: forms[2]
  };

  return rules[rule];
}
