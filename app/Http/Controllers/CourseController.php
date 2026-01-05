<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Certificate;
use App\Models\Course;
use App\Models\CourseRating;
use App\Models\Invoice;
use App\Models\Tool;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class CourseController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $isAffiliate = $user->hasRole('affiliate');

        $query = Course::with(['category', 'user', 'certificate'])->latest();

        if ($user->hasRole('mentor')) {
            $query->where('user_id', $user->id);
        } elseif ($isAffiliate) {
            $query->where('status', 'published');
        }

        $courses = $query->get();

        $totalCourses = $courses->count();
        $publishedCourses = $courses->where('status', 'published')->count();
        $draftCourses = $courses->where('status', 'draft')->count();
        $archivedCourses = $courses->where('status', 'archived')->count();

        $freeCourses = $courses->where('price', 0)->count();
        $paidCourses = $courses->where('price', '>', 0)->count();

        $beginnerCourses = $courses->where('level', 'beginner')->count();
        $intermediateCourses = $courses->where('level', 'intermediate')->count();
        $advancedCourses = $courses->where('level', 'advanced')->count();

        $coursesWithCertificate = $courses->whereNotNull('certificate')->count();
        $coursesWithoutCertificate = $totalCourses - $coursesWithCertificate;

        $courseIds = $courses->pluck('id');
        $totalEnrollments = Invoice::where('status', 'paid')
            ->whereHas('courseItems', function ($query) use ($courseIds) {
                $query->whereIn('course_id', $courseIds);
            })
            ->count();

        $totalRevenue = Invoice::where('status', 'paid')
            ->whereHas('courseItems', function ($query) use ($courseIds) {
                $query->whereIn('course_id', $courseIds);
            })
            ->sum('nett_amount');

        $statistics = [
            'overview' => [
                'total_courses' => $totalCourses,
                'published_courses' => $publishedCourses,
                'draft_courses' => $draftCourses,
                'archived_courses' => $archivedCourses,
            ],
            'pricing' => [
                'free_courses' => $freeCourses,
                'paid_courses' => $paidCourses,
            ],
            'level' => [
                'beginner' => $beginnerCourses,
                'intermediate' => $intermediateCourses,
                'advanced' => $advancedCourses,
            ],
            'performance' => [
                'total_enrollments' => $totalEnrollments,
                'total_revenue' => $totalRevenue,
            ],
        ];

        return Inertia::render('admin/courses/index', [
            'courses' => $courses,
            'statistics' => $statistics,
        ]);
    }

    public function create()
    {
        $categories = Category::all();
        $tools = Tool::all();
        return Inertia::render('admin/courses/create', ['categories' => $categories, 'tools' => $tools]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
            'short_description' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'key_points' => 'nullable|string',
            'thumbnail' => 'nullable|image|mimes:jpeg,jpg,png|max:2048',
            'strikethrough_price' => 'required|numeric|min:0',
            'price' => 'required|numeric|min:0',
            'level' => 'required|string|in:beginner,intermediate,advanced',
            'sneak_peek_images' => 'nullable|array|max:4',
            'sneak_peek_images.*' => 'image|mimes:jpeg,jpg,png|max:2048',
            'tools' => 'nullable|array',
            'tools.*' => 'exists:tools,id',
        ]);

        $data = $request->all();
        $slug = Str::slug($data['title']);
        $originalSlug = $slug;
        $counter = 1;
        while (Course::where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $counter++;
        }
        $data['slug'] = $slug;

        if ($request->hasFile('thumbnail')) {
            $thumbnail = $request->file('thumbnail');
            $thumbnailPath = $thumbnail->store('thumbnails', 'public');
            $data['thumbnail'] = $thumbnailPath;
        } else {
            $data['thumbnail'] = null;
        }
        $data['user_id'] = $request->user()->id;
        $data['course_url'] = url('/course/' . $slug);
        $data['registration_url'] = url('/course/' . $slug . '/checkout');
        $data['status'] = 'draft';

        $course = Course::create($data);

        if ($request->has('tools') && is_array($request->tools)) {
            $course->tools()->sync($request->tools);
        }

        if ($request->hasFile('sneak_peek_images')) {
            foreach ($request->file('sneak_peek_images') as $idx => $image) {
                if ($idx >= 4) break;
                $path = $image->store('course_images', 'public');
                $course->images()->create([
                    'image_url' => $path,
                    'order' => $idx,
                ]);
            }
        }

        if ($request->has('modules')) {
            $modules = json_decode($request->input('modules'), true);
            if (is_array($modules)) {
                foreach ($modules as $modIdx => $mod) {
                    $module = $course->modules()->create([
                        'title' => $mod['title'],
                        'description' => $mod['description'] ?? null,
                        'order' => $modIdx,
                    ]);
                    if (isset($mod['lessons']) && is_array($mod['lessons'])) {
                        foreach ($mod['lessons'] as $lessonIdx => $lesson) {
                            $attachmentPath = null;
                            $fileKey = "modules.{$modIdx}.lessons.{$lessonIdx}.attachment";
                            if ($lesson['type'] === 'file' && $request->hasFile($fileKey)) {
                                $attachmentPath = $request->file($fileKey)->store('lesson_attachments', 'public');
                            }
                            $lessonModel = $module->lessons()->create([
                                'title' => $lesson['title'],
                                'description' => $lesson['description'] ?? null,
                                'type' => $lesson['type'],
                                'content' => $lesson['content'] ?? null,
                                'video_url' => $lesson['type'] === 'video' ? ($lesson['video_url'] ?? null) : null,
                                'attachment' => $attachmentPath,
                                'is_free' => $lesson['is_free'] ?? false,
                                'is_preview' => $lesson['is_preview'] ?? true,
                                'order' => $lessonIdx,
                            ]);
                            if ($lesson['type'] === 'quiz' && !empty($lesson['quizzes'])) {
                                $quizData = $lesson['quizzes'][0];
                                $lessonModel->quizzes()->create([
                                    'title' => $lesson['title'],
                                    'instructions' => $quizData['instructions'] ?? null,
                                    'time_limit' => $quizData['time_limit'] ?? 0,
                                    'passing_score' => $quizData['passing_score'] ?? 0,
                                ]);
                            }
                        }
                    }
                }
            }
        }

        return redirect()->route('courses.index')->with('success', 'Kursus berhasil dibuat.');
    }

    public function show(string $id)
    {
        $course = Course::with(['category', 'user', 'tools', 'images', 'modules.lessons.quizzes.questions'])->findOrFail($id);

        $transactions = Invoice::with(['user.referrer'])
            ->whereHas('courseItems', function ($query) use ($id) {
                $query->where('course_id', $id);
            })
            ->latest()
            ->get();

        $ratings = CourseRating::with(['user'])
            ->where('course_id', $course->id)
            ->orderBy('created_at', 'desc')
            ->get();

        $certificate = Certificate::where('course_id', $id)->first();

        return Inertia::render('admin/courses/show', [
            'course' => $course,
            'transactions' => $transactions,
            'ratings' => $ratings,
            'certificate' => $certificate
        ]);
    }

    public function edit(string $id)
    {
        $course = Course::with(['tools', 'images', 'modules.lessons.quizzes'])->findOrFail($id);

        $categories = Category::all();
        $tools = Tool::all();
        return Inertia::render('admin/courses/edit', ['course' => $course, 'categories' => $categories, 'tools' => $tools]);
    }

    public function update(Request $request, string $id)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
            'short_description' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'key_points' => 'nullable|string',
            'thumbnail' => 'nullable|image|mimes:jpeg,jpg,png|max:2048',
            'strikethrough_price' => 'required|numeric|min:0',
            'price' => 'required|numeric|min:0',
            'level' => 'required|string|in:beginner,intermediate,advanced',
            'sneak_peek_images' => 'nullable|array|max:4',
            'sneak_peek_images.*' => 'image|mimes:jpeg,jpg,png|max:2048',
            'tools' => 'nullable|array',
            'tools.*' => 'exists:tools,id',
        ]);

        $course = Course::with(['images', 'modules.lessons'])->findOrFail($id);
        $data = $request->all();

        $slug = Str::slug($data['title']);
        $originalSlug = $slug;
        $counter = 1;
        while (Course::where('slug', $slug)->where('id', '!=', $course->id)->exists()) {
            $slug = $originalSlug . '-' . $counter++;
        }
        $data['slug'] = $slug;

        // Handle thumbnail
        if ($request->hasFile('thumbnail')) {
            if ($course->thumbnail) {
                Storage::disk('public')->delete($course->thumbnail);
            }
            $thumbnail = $request->file('thumbnail');
            $thumbnailPath = $thumbnail->store('thumbnails', 'public');
            $data['thumbnail'] = $thumbnailPath;
        } else {
            unset($data['thumbnail']);
        }

        $data['course_url'] = url('/course/' . $slug);
        $data['registration_url'] = url('/course/' . $slug . '/checkout');

        $course->update($data);

        // Sync tools
        if ($request->has('tools') && is_array($request->tools)) {
            $course->tools()->sync($request->tools);
        } else {
            $course->tools()->sync([]);
        }

        // Sneak peek images: remove old, add new
        if ($request->hasFile('sneak_peek_images')) {
            // Delete old images
            foreach ($course->images as $img) {
                Storage::disk('public')->delete($img->image_url);
                $img->delete();
            }
            // Store new images
            foreach ($request->file('sneak_peek_images') as $idx => $image) {
                if ($idx >= 4) break;
                $path = $image->store('course_images', 'public');
                $course->images()->create([
                    'image_url' => $path,
                    'order' => $idx,
                ]);
            }
        }

        if ($request->has('modules')) {
            $modules = json_decode($request->input('modules'), true);

            if (is_array($modules)) {
                // Get all existing module and lesson IDs from frontend data
                $frontendModuleIds = [];
                $frontendLessonIds = [];

                foreach ($modules as $mod) {
                    if (isset($mod['id']) && !empty($mod['id'])) {
                        $frontendModuleIds[] = $mod['id'];
                    }
                    if (isset($mod['lessons']) && is_array($mod['lessons'])) {
                        foreach ($mod['lessons'] as $lesson) {
                            if (isset($lesson['id']) && !empty($lesson['id'])) {
                                $frontendLessonIds[] = $lesson['id'];
                            }
                        }
                    }
                }

                // Delete modules that exist in database but not in frontend data
                $course->modules()->with('lessons')->get()->each(function ($module) use ($frontendModuleIds, $frontendLessonIds) {
                    if (!in_array($module->id, $frontendModuleIds)) {
                        // Delete all lessons in this module and their files
                        $module->lessons->each(function ($lesson) {
                            if ($lesson->attachment) {
                                Storage::disk('public')->delete($lesson->attachment);
                            }
                            $lesson->delete();
                        });
                        $module->delete();
                    } else {
                        // Delete lessons that exist in database but not in frontend data
                        $module->lessons->each(function ($lesson) use ($frontendLessonIds) {
                            if (!in_array($lesson->id, $frontendLessonIds)) {
                                // Delete lesson's files if they exist
                                if ($lesson->attachment) {
                                    Storage::disk('public')->delete($lesson->attachment);
                                }
                                $lesson->delete();
                            }
                        });
                    }
                });

                foreach ($modules as $modIdx => $mod) {
                    // Update or create module
                    $module = null;
                    if (isset($mod['id'])) {
                        $module = $course->modules()->where('id', $mod['id'])->first();
                        if ($module) {
                            $module->update([
                                'title' => $mod['title'],
                                'description' => $mod['description'] ?? null,
                                'order' => $modIdx,
                            ]);
                        }
                    }
                    if (!$module) {
                        $module = $course->modules()->create([
                            'title' => $mod['title'],
                            'description' => $mod['description'] ?? null,
                            'order' => $modIdx,
                        ]);
                    }

                    if (isset($mod['lessons']) && is_array($mod['lessons'])) {
                        foreach ($mod['lessons'] as $lessonIdx => $lesson) {

                            if (isset($lesson['id']) && !empty($lesson['id'])) {
                                $lessonModel = $module->lessons()->where('id', $lesson['id'])->first();
                                if ($lessonModel) {
                                    $attachmentPath = $lessonModel->attachment;
                                    $fileKey = "modules.{$modIdx}.lessons.{$lessonIdx}.attachment";
                                    if ($lesson['type'] === 'file' && $request->hasFile($fileKey)) {
                                        if ($attachmentPath) {
                                            Storage::disk('public')->delete($attachmentPath);
                                        }
                                        $attachmentPath = $request->file($fileKey)->store('lesson_attachments', 'public');
                                    }
                                    $lessonModel->update([
                                        'title' => $lesson['title'],
                                        'description' => $lesson['description'] ?? null,
                                        'type' => $lesson['type'],
                                        'content' => $lesson['content'] ?? null,
                                        'video_url' => $lesson['type'] === 'video' ? ($lesson['video_url'] ?? null) : null,
                                        'attachment' => $lesson['type'] === 'file' ? $attachmentPath : null,
                                        'is_free' => $lesson['is_free'] ?? false,
                                        'is_preview' => $lesson['is_preview'] ?? true,
                                        'order' => $lessonIdx,
                                    ]);
                                } else {
                                    // ID provided but lesson not found - this shouldn't happen
                                    throw new \Exception("Lesson with ID {$lesson['id']} not found for update");
                                }
                            } else {
                                // CREATE new lesson (no ID provided)
                                $attachmentPath = null;
                                $fileKey = "modules.{$modIdx}.lessons.{$lessonIdx}.attachment";
                                if ($lesson['type'] === 'file' && $request->hasFile($fileKey)) {
                                    $attachmentPath = $request->file($fileKey)->store('lesson_attachments', 'public');
                                }
                                $lessonModel = $module->lessons()->create([
                                    'title' => $lesson['title'],
                                    'description' => $lesson['description'] ?? null,
                                    'type' => $lesson['type'],
                                    'content' => $lesson['content'] ?? null,
                                    'video_url' => $lesson['type'] === 'video' ? ($lesson['video_url'] ?? null) : null,
                                    'attachment' => $lesson['type'] === 'file' ? $attachmentPath : null,
                                    'is_free' => $lesson['is_free'] ?? false,
                                    'is_preview' => $lesson['is_preview'] ?? true,
                                    'order' => $lessonIdx,
                                ]);
                            }

                            // Quiz
                            if ($lesson['type'] === 'quiz' && !empty($lesson['quizzes'])) {
                                $quizData = $lesson['quizzes'][0];
                                $quizModel = $lessonModel->quizzes()->first();
                                if ($quizModel) {
                                    $quizModel->update([
                                        'title' => $lesson['title'],
                                        'instructions' => $quizData['instructions'] ?? null,
                                        'time_limit' => $quizData['time_limit'] ?? 0,
                                        'passing_score' => $quizData['passing_score'] ?? 0,
                                    ]);
                                } else {
                                    $lessonModel->quizzes()->create([
                                        'title' => $lesson['title'],
                                        'instructions' => $quizData['instructions'] ?? null,
                                        'time_limit' => $quizData['time_limit'] ?? 0,
                                        'passing_score' => $quizData['passing_score'] ?? 0,
                                    ]);
                                }
                                // Untuk pertanyaan dan opsi quiz, lakukan hal serupa jika diperlukan
                            }
                        }
                    }
                }
            }
        }

        return redirect()->route('courses.show', $course->id)->with('success', 'Kursus berhasil diperbarui.');
    }

    public function destroy(string $id)
    {
        $course = Course::findOrFail($id);
        $course->delete();
        return redirect()->route('courses.index')->with('success', 'Kursus berhasil dihapus.');
    }

    public function duplicate(string $id)
    {
        $course = Course::with(['tools', 'modules.lessons'])->findOrFail($id);

        $newCourse = $course->replicate();
        // Duplicate thumbnail if exists
        if ($course->thumbnail && Storage::disk('public')->exists($course->thumbnail)) {
            $originalPath = $course->thumbnail;
            $extension = pathinfo($originalPath, PATHINFO_EXTENSION);
            $newFileName = 'thumbnails/' . uniqid('copy_') . '.' . $extension;
            Storage::disk('public')->copy($originalPath, $newFileName);
            $newCourse->thumbnail = $newFileName;
        } else {
            $newCourse->thumbnail = null;
        }

        // Generate unique slug
        $slug = Str::slug($newCourse->title);
        $originalSlug = $slug;
        $counter = 1;
        while (Course::where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $counter++;
        }
        $newCourse->slug = $slug;
        $newCourse->status = 'draft';
        $newCourse->course_url = url('/course/' . $slug);
        $newCourse->registration_url = url('/course/' . $slug . '/checkout');
        $newCourse->save();

        // Duplicate course images
        if ($course->images && $course->images->count() > 0) {
            foreach ($course->images as $image) {
                $newImagePath = null;
                if ($image->image_url && Storage::disk('public')->exists($image->image_url)) {
                    $ext = pathinfo($image->image_url, PATHINFO_EXTENSION);
                    $newImagePath = 'course_images/' . uniqid('copy_') . '.' . $ext;
                    Storage::disk('public')->copy($image->image_url, $newImagePath);
                }
                $newCourse->images()->create([
                    'image_url' => $newImagePath,
                    'order' => $image->order,
                ]);
            }
        }

        // Duplicate tools
        if ($course->tools && $course->tools->count() > 0) {
            $newCourse->tools()->sync($course->tools->pluck('id')->toArray());
        }

        // Duplicate modules and lessons
        foreach ($course->modules as $module) {
            $newModule = $module->replicate();
            $newModule->course_id = $newCourse->id;
            $newModule->save();

            foreach ($module->lessons as $lesson) {
                $newLesson = $lesson->replicate();
                $newLesson->module_id = $newModule->id;
                // Duplicate attachment if exists
                if ($lesson->attachment && Storage::disk('public')->exists($lesson->attachment)) {
                    $originalAttachment = $lesson->attachment;
                    $ext = pathinfo($originalAttachment, PATHINFO_EXTENSION);
                    $newAttachment = 'lesson_attachments/' . uniqid('copy_') . '.' . $ext;
                    Storage::disk('public')->copy($originalAttachment, $newAttachment);
                    $newLesson->attachment = $newAttachment;
                }
                $newLesson->save();

                // Duplicate quizzes (jika ada)
                if ($lesson->quizzes && $lesson->quizzes->count() > 0) {
                    foreach ($lesson->quizzes as $quiz) {
                        $newQuiz = $quiz->replicate();
                        $newQuiz->lesson_id = $newLesson->id;
                        $newQuiz->save();

                        // Duplicate questions (jika ada)
                        if ($quiz->questions && $quiz->questions->count() > 0) {
                            foreach ($quiz->questions as $question) {
                                $newQuestion = $question->replicate();
                                $newQuestion->quiz_id = $newQuiz->id;
                                $newQuestion->save();

                                // Duplicate question options (jika ada)
                                if ($question->options && $question->options->count() > 0) {
                                    foreach ($question->options as $option) {
                                        $newOption = $option->replicate();
                                        $newOption->question_id = $newQuestion->id;
                                        $newOption->save();
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        return redirect()->route('courses.show', $newCourse->id)
            ->with('success', 'Kelas berhasil diduplikasi. Silakan edit sebelum dipublikasikan.');
    }

    public function publish(string $id)
    {
        $course = Course::findOrFail($id);
        $course->status = 'published';
        $course->save();

        return back()->with('success', 'Kelas berhasil dipublikasikan.');
    }

    public function archive(string $id)
    {
        $course = Course::findOrFail($id);
        $course->status = 'archived';
        $course->save();

        return back()->with('success', 'Kelas berhasil diarsipkan.');
    }
}
