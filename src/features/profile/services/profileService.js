import { supabase } from '../../../lib/supabaseClient'

function normalizeList(items) {
  return [...new Set(items.map((item) => item.value.trim()).filter(Boolean))]
}

export async function getTeacherProfile(userId) {
  const [profileResponse, subjectsResponse, groupsResponse] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase.from('teacher_subjects').select('*').eq('user_id', userId).order('name'),
    supabase.from('teacher_groups').select('*').eq('user_id', userId).order('label'),
  ])

  if (profileResponse.error) throw profileResponse.error
  if (subjectsResponse.error) throw subjectsResponse.error
  if (groupsResponse.error) throw groupsResponse.error

  return {
    profile: profileResponse.data,
    subjects: subjectsResponse.data ?? [],
    groups: groupsResponse.data ?? [],
  }
}

export function isTeacherProfileComplete(profileData) {
  return Boolean(
    profileData?.profile?.full_name?.trim() &&
      profileData?.profile?.institution?.trim() &&
      profileData?.subjects?.length > 0 &&
      profileData?.groups?.length > 0,
  )
}

export async function saveTeacherProfile(userId, values) {
  const subjects = normalizeList(values.subjects)
  const groups = normalizeList(values.groups)

  const { error: profileError } = await supabase.from('profiles').upsert({
    id: userId,
    full_name: values.fullName.trim(),
    institution: values.institution.trim(),
  })

  if (profileError) throw profileError

  const current = await getTeacherProfile(userId)
  const subjectIdsToDelete = current.subjects
    .filter((subject) => !subjects.includes(subject.name))
    .map((subject) => subject.id)
  const groupIdsToDelete = current.groups
    .filter((group) => !groups.includes(group.label))
    .map((group) => group.id)

  if (subjectIdsToDelete.length > 0) {
    const { error } = await supabase.from('teacher_subjects').delete().in('id', subjectIdsToDelete)
    if (error) throw error
  }

  if (groupIdsToDelete.length > 0) {
    const { error } = await supabase.from('teacher_groups').delete().in('id', groupIdsToDelete)
    if (error) throw error
  }

  const newSubjects = subjects.filter(
    (subject) => !current.subjects.some((savedSubject) => savedSubject.name === subject),
  )
  const newGroups = groups.filter((group) => !current.groups.some((savedGroup) => savedGroup.label === group))

  if (newSubjects.length > 0) {
    const { error } = await supabase
      .from('teacher_subjects')
      .insert(newSubjects.map((name) => ({ user_id: userId, name })))
    if (error) throw error
  }

  if (newGroups.length > 0) {
    const { error } = await supabase
      .from('teacher_groups')
      .insert(newGroups.map((label) => ({ user_id: userId, label })))
    if (error) throw error
  }

  return getTeacherProfile(userId)
}
