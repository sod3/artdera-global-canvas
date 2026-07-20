export function mergeSponsoredResults<T>(organic: T[], sponsored: T[], limit: number): T[] {
  if (limit <= 0) return [];
  const result: T[] = [];
  let organicIndex = 0;
  let sponsoredIndex = 0;
  while (result.length < limit && (organicIndex < organic.length || sponsoredIndex < sponsored.length)) {
    const positionInBlock = result.length % 5;
    const canPlaceSponsored = positionInBlock === 4 && sponsoredIndex < sponsored.length;
    if (canPlaceSponsored) {
      result.push(sponsored[sponsoredIndex++]);
    } else if (organicIndex < organic.length) {
      result.push(organic[organicIndex++]);
    } else if (sponsoredIndex < sponsored.length && result.filter((_, index) => index % 5 === 4).length < Math.ceil(limit / 5)) {
      while (result.length % 5 !== 4 && result.length < limit && organicIndex < organic.length) {
        result.push(organic[organicIndex++]);
      }
      if (result.length % 5 === 4) result.push(sponsored[sponsoredIndex++]);
      else break;
    } else break;
  }
  return result.slice(0, limit);
}
