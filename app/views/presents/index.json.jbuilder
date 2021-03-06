json.presents(@presents) do |present|

  json.id present.id
  json.child_id present.child_id
  json.elf_id present.elf_id
  json.toy_id present.toy_id
  json.created_at time_ago_in_words(present.created_at) + " ago"
  json.toy present.toy

end
