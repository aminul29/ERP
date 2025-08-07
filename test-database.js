// Simple database connection test
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://loqpyxuwmjmfmqxypfdx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvcXB5eHV3bWptZm1xeHlwZmR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzOTgwMzEsImV4cCI6MjA2OTk3NDAzMX0.JvGzOLoOo7TmOdN68UcfWuHB-Ukv3IbaI1uSTnBVRbc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    // Test teammates table
    const { data, error } = await supabase
      .from('teammates')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ Database error:', error)
      return
    }
    
    console.log('✅ Database connection successful!')
    console.log('📊 Sample data:', data)
    
    // Test ERP settings
    const { data: settings, error: settingsError } = await supabase
      .from('erp_settings')
      .select('*')
      .limit(1)
    
    if (settingsError) {
      console.error('❌ ERP Settings error:', settingsError)
    } else {
      console.log('⚙️ ERP Settings:', settings)
    }
    
  } catch (err) {
    console.error('❌ Connection failed:', err)
  }
}

testConnection()
