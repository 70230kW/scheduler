export async function lookupContactName(
  accessToken: string,
  email: string
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://people.googleapis.com/v1/people:searchContacts?query=${encodeURIComponent(email)}&readMask=names,emailAddresses&pageSize=5`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const results = data.results as Array<{
      person: {
        names?: Array<{ displayName: string }>;
        emailAddresses?: Array<{ value: string }>;
      };
    }> | undefined;
    if (!results?.length) return null;
    for (const result of results) {
      const emails = result.person.emailAddresses ?? [];
      const match = emails.find((e) => e.value.toLowerCase() === email.toLowerCase());
      if (match && result.person.names?.[0]) {
        return result.person.names[0].displayName;
      }
    }
    return null;
  } catch {
    return null;
  }
}
