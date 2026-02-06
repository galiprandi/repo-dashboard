import { fetchGitRepoInfo } from './src/api/git'

async function testGitEndpoint() {
  try {
    console.log('Testing git endpoint with Cencosud-xlabs/yumi-ticket-control...')
    const result = await fetchGitRepoInfo('Cencosud-xlabs/yumi-ticket-control')
    
    console.log('\n=== COMMITS ===')
    result.commits.forEach((commit, index) => {
      console.log(`${index + 1}. ${commit.hash.substring(0, 8)} - ${commit.date}`)
      console.log(`   ${commit.message}`)
      console.log(`   Author: ${commit.author}\n`)
    })
    
    console.log('\n=== TAGS ===')
    result.tags.forEach((tag, index) => {
      console.log(`${index + 1}. ${tag.name} - ${tag.date}`)
      console.log(`   Commit: ${tag.commit.substring(0, 8)}\n`)
    })
    
    console.log(`\n✅ Success! Found ${result.commits.length} commits and ${result.tags.length} tags`)
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error')
  }
}

testGitEndpoint()
