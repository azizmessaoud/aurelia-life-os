import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  blackboardUrl: string;
  syncType: 'full' | 'schedule' | 'assignments' | 'materials';
  courseUrls?: string[];
}

interface ParsedCourse {
  courseCode: string;
  courseName: string;
  instructor?: string;
  blackboardUrl: string;
}

interface ParsedAssignment {
  title: string;
  description?: string;
  dueDate: string;
  courseCode: string;
  isExam: boolean;
}

interface ParsedScheduleItem {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location?: string;
  courseCode: string;
  scheduleType: string;
}

interface ParsedMaterial {
  title: string;
  materialType: string;
  fileUrl?: string;
  description?: string;
  weekNumber?: number;
  courseCode: string;
}

// Parse course information from scraped content
function parseCourses(markdown: string): ParsedCourse[] {
  const courses: ParsedCourse[] = [];
  
  // Common patterns for course extraction
  // Pattern: "COURSE_CODE - Course Name" or "COURSE_CODE: Course Name"
  const coursePattern = /([A-Z]{2,4}\d{3,4}[A-Z]?)\s*[-:]\s*([^\n\r]+)/gi;
  
  let match;
  while ((match = coursePattern.exec(markdown)) !== null) {
    courses.push({
      courseCode: match[1].toUpperCase(),
      courseName: match[2].trim(),
      blackboardUrl: '',
    });
  }
  
  return courses;
}

// Parse assignments from scraped content
function parseAssignments(markdown: string, courseCode: string): ParsedAssignment[] {
  const assignments: ParsedAssignment[] = [];
  
  // Look for assignment patterns with due dates
  // Pattern: "Assignment Title" followed by "Due: DATE" or "Deadline: DATE"
  const assignmentBlocks = markdown.split(/(?=assignment|homework|project|exam|quiz|test)/gi);
  
  for (const block of assignmentBlocks) {
    const titleMatch = block.match(/^(assignment|homework|project|exam|quiz|test)[:\s]+([^\n]+)/i);
    const dueDateMatch = block.match(/(?:due|deadline|submit by)[:\s]+([^\n]+)/i);
    
    if (titleMatch && dueDateMatch) {
      const isExam = /exam|quiz|test|midterm|final/i.test(titleMatch[1]);
      assignments.push({
        title: titleMatch[2].trim(),
        description: block.substring(0, 500),
        dueDate: dueDateMatch[1].trim(),
        courseCode,
        isExam,
      });
    }
  }
  
  return assignments;
}

// Parse schedule from scraped content
function parseSchedule(markdown: string, courseCode: string): ParsedScheduleItem[] {
  const schedule: ParsedScheduleItem[] = [];
  
  const dayMap: Record<string, number> = {
    'sunday': 0, 'sun': 0,
    'monday': 1, 'mon': 1,
    'tuesday': 2, 'tue': 2,
    'wednesday': 3, 'wed': 3,
    'thursday': 4, 'thu': 4,
    'friday': 5, 'fri': 5,
    'saturday': 6, 'sat': 6,
  };
  
  // Pattern: "Monday 9:00 AM - 10:30 AM Room A101"
  const schedulePattern = /(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\s+(\d{1,2}:\d{2}\s*(?:am|pm)?)\s*[-–]\s*(\d{1,2}:\d{2}\s*(?:am|pm)?)\s*(?:room|location)?[:\s]*([^\n]*)/gi;
  
  let match;
  while ((match = schedulePattern.exec(markdown)) !== null) {
    const dayName = match[1].toLowerCase();
    schedule.push({
      dayOfWeek: dayMap[dayName] ?? 1,
      startTime: match[2].trim(),
      endTime: match[3].trim(),
      location: match[4]?.trim() || undefined,
      courseCode,
      scheduleType: 'lecture',
    });
  }
  
  return schedule;
}

// Parse materials from scraped content
function parseMaterials(markdown: string, courseCode: string): ParsedMaterial[] {
  const materials: ParsedMaterial[] = [];
  
  // Look for links to materials
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  const weekPattern = /week\s*(\d+)/i;
  
  let match;
  while ((match = linkPattern.exec(markdown)) !== null) {
    const title = match[1];
    const url = match[2];
    
    // Determine material type from file extension or title
    let materialType = 'document';
    if (/\.pdf$/i.test(url)) materialType = 'slides';
    else if (/\.ppt/i.test(url)) materialType = 'slides';
    else if (/\.mp4|\.mov|video/i.test(url)) materialType = 'video';
    else if (/lecture/i.test(title)) materialType = 'lecture';
    else if (/reading|chapter/i.test(title)) materialType = 'reading';
    
    // Try to extract week number from context
    const contextStart = Math.max(0, match.index - 100);
    const context = markdown.substring(contextStart, match.index);
    const weekMatch = weekPattern.exec(context);
    
    materials.push({
      title,
      materialType,
      fileUrl: url,
      weekNumber: weekMatch ? parseInt(weekMatch[1]) : undefined,
      courseCode,
    });
  }
  
  return materials;
}

async function scrapeUrl(url: string, apiKey: string): Promise<string> {
  console.log('Scraping:', url);
  
  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      formats: ['markdown'],
      onlyMainContent: true,
      waitFor: 3000, // Wait for dynamic content
    }),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || `Failed to scrape ${url}`);
  }
  
  return data.data?.markdown || data.markdown || '';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
  
  if (!firecrawlKey) {
    return new Response(
      JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { blackboardUrl, syncType, courseUrls }: SyncRequest = await req.json();

    if (!blackboardUrl) {
      return new Response(
        JSON.stringify({ success: false, error: 'Blackboard URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create sync log entry
    const { data: syncLog, error: logError } = await supabase
      .from('blackboard_sync_logs')
      .insert({
        sync_type: syncType,
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (logError) {
      console.error('Failed to create sync log:', logError);
    }

    const syncLogId = syncLog?.id;
    let itemsSynced = 0;
    const errors: string[] = [];

    try {
      // Scrape main Blackboard page for courses
      console.log('Starting Blackboard sync from:', blackboardUrl);
      const mainContent = await scrapeUrl(blackboardUrl, firecrawlKey);
      
      // Parse courses from main page
      const courses = parseCourses(mainContent);
      console.log(`Found ${courses.length} courses`);

      // Insert or update courses
      for (const course of courses) {
        const { error } = await supabase
          .from('academic_courses')
          .upsert(
            {
              course_code: course.courseCode,
              course_name: course.courseName,
              instructor: course.instructor,
              blackboard_url: course.blackboardUrl || blackboardUrl,
            },
            { onConflict: 'course_code' }
          );
        
        if (error) {
          console.error('Error inserting course:', error);
          errors.push(`Course ${course.courseCode}: ${error.message}`);
        } else {
          itemsSynced++;
        }
      }

      // If specific course URLs provided, scrape each one
      const urlsToScrape = courseUrls || [];
      
      for (const courseUrl of urlsToScrape) {
        try {
          const courseContent = await scrapeUrl(courseUrl, firecrawlKey);
          const courseCode = courses.find(c => courseUrl.includes(c.courseCode))?.courseCode || 'UNKNOWN';
          
          // Get course ID
          const { data: courseData } = await supabase
            .from('academic_courses')
            .select('id')
            .eq('course_code', courseCode)
            .single();
          
          if (!courseData) continue;
          
          // Parse and insert assignments
          if (syncType === 'full' || syncType === 'assignments') {
            const assignments = parseAssignments(courseContent, courseCode);
            for (const assignment of assignments) {
              const { error } = await supabase
                .from('academic_assignments')
                .insert({
                  course_id: courseData.id,
                  title: assignment.title,
                  description: assignment.description,
                  due_date: new Date(assignment.dueDate).toISOString(),
                  is_exam: assignment.isExam,
                });
              
              if (!error) itemsSynced++;
            }
          }
          
          // Parse and insert schedule
          if (syncType === 'full' || syncType === 'schedule') {
            const schedule = parseSchedule(courseContent, courseCode);
            for (const item of schedule) {
              const { error } = await supabase
                .from('academic_schedule')
                .insert({
                  course_id: courseData.id,
                  day_of_week: item.dayOfWeek,
                  start_time: item.startTime,
                  end_time: item.endTime,
                  location: item.location,
                  schedule_type: item.scheduleType,
                });
              
              if (!error) itemsSynced++;
            }
          }
          
          // Parse and insert materials
          if (syncType === 'full' || syncType === 'materials') {
            const materials = parseMaterials(courseContent, courseCode);
            for (const material of materials) {
              const { error } = await supabase
                .from('academic_materials')
                .insert({
                  course_id: courseData.id,
                  title: material.title,
                  material_type: material.materialType,
                  file_url: material.fileUrl,
                  week_number: material.weekNumber,
                });
              
              if (!error) itemsSynced++;
            }
          }
        } catch (err) {
          console.error(`Error scraping ${courseUrl}:`, err);
          errors.push(`URL ${courseUrl}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

      // Update sync log with success
      if (syncLogId) {
        await supabase
          .from('blackboard_sync_logs')
          .update({
            status: errors.length > 0 ? 'completed_with_errors' : 'completed',
            items_synced: itemsSynced,
            error_message: errors.length > 0 ? errors.join('; ') : null,
            completed_at: new Date().toISOString(),
          })
          .eq('id', syncLogId);
      }

      console.log(`Sync completed. Items synced: ${itemsSynced}, Errors: ${errors.length}`);

      return new Response(
        JSON.stringify({
          success: true,
          itemsSynced,
          errors: errors.length > 0 ? errors : undefined,
          syncLogId,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (syncError) {
      console.error('Sync error:', syncError);
      
      // Update sync log with failure
      if (syncLogId) {
        await supabase
          .from('blackboard_sync_logs')
          .update({
            status: 'failed',
            error_message: syncError instanceof Error ? syncError.message : 'Unknown error',
            completed_at: new Date().toISOString(),
          })
          .eq('id', syncLogId);
      }

      throw syncError;
    }

  } catch (error) {
    console.error('Error in blackboard-sync:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to sync';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
