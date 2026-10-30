import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Assessment,
  AssessmentListItem,
  AttemptResult,
  Question
} from '../types';
import {
  GraduationCap,
  Upload,
  Plus,
  Play,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  FileText,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Award,
  BookOpen
} from 'lucide-react';

export const AssessmentsPage: React.FC = () => {
  const [assessments, setAssessments] = useState<AssessmentListItem[]>([]);
  const [viewMode, setViewMode] = useState<'LIST' | 'CREATE' | 'TAKE' | 'RESULT'>('LIST');

  // Create state
  const [topic, setTopic] = useState('');
  const [title, setTitle] = useState('');
  const [assessmentType, setAssessmentType] = useState('MCQ');
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [questionCount, setQuestionCount] = useState(5);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(10);
  const [textContent, setTextContent] = useState('');
  const [uploadedMaterialId, setUploadedMaterialId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadFileName, setUploadFileName] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  // Take state
  const [currentAssessment, setCurrentAssessment] = useState<Assessment | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  // Result state
  const [attemptResult, setAttemptResult] = useState<AttemptResult | null>(null);

  const loadAssessments = async () => {
    try {
      const list = await api.listAssessments();
      setAssessments(list);
    } catch (err) {
      console.log('[Assessments] Error loading assessments:', err);
    }
  };

  useEffect(() => {
    loadAssessments();
  }, []);

  // Timer countdown while taking assessment
  useEffect(() => {
    if (viewMode === 'TAKE' && currentAssessment && currentAssessment.time_limit_minutes > 0) {
      if (timeRemainingSeconds <= 0) {
        handleAutoSubmit();
        return;
      }

      const timerId = setInterval(() => {
        setTimeRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerId);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timerId);
    }
  }, [viewMode, timeRemainingSeconds]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadFileName(file.name);
    try {
      const res = await api.uploadStudyMaterial(file);
      setUploadedMaterialId(res.material_id);
      if (!topic) {
        setTopic(file.name.replace(/\.[^/.]+$/, ''));
      }
    } catch (err: any) {
      alert(`File upload failed: ${err.message || err}`);
      setUploadFileName(null);
    } finally {
      setUploading(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setGenerating(true);
    try {
      const newAssessment = await api.generateAssessment({
        title: title.trim() || `${topic.trim()} Assessment`,
        subject_topic: topic.trim(),
        assessment_type: assessmentType,
        difficulty,
        question_count: questionCount,
        time_limit_minutes: timeLimitMinutes,
        text_content: textContent.trim() || undefined,
        material_id: uploadedMaterialId || undefined,
      });

      // Launch test immediately
      startTakingAssessment(newAssessment);
      loadAssessments();
    } catch (err: any) {
      alert(`Failed to generate assessment: ${err.message || err}`);
    } finally {
      setGenerating(false);
    }
  };

  const startTakingAssessment = async (assessment: Assessment | AssessmentListItem) => {
    try {
      const fullAssessment = await api.getAssessment(assessment.id);
      setCurrentAssessment(fullAssessment);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setTimeRemainingSeconds(fullAssessment.time_limit_minutes * 60);
      setViewMode('TAKE');
    } catch (err) {
      console.log('[Assessments] Error starting quiz:', err);
    }
  };

  const handleSelectAnswer = (questionId: string, answer: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleAutoSubmit = async () => {
    if (submitting) return;
    handleSubmitAssessment();
  };

  const handleSubmitAssessment = async () => {
    if (!currentAssessment) return;
    setSubmitting(true);

    const answersList = currentAssessment.questions.map((q) => ({
      question_id: q.id,
      answer: selectedAnswers[q.id] || '',
    }));

    const totalSeconds = currentAssessment.time_limit_minutes * 60;
    const timeSpent = currentAssessment.time_limit_minutes > 0
      ? Math.max(1, totalSeconds - timeRemainingSeconds)
      : 60;

    try {
      const result = await api.submitAssessment(currentAssessment.id, answersList, timeSpent);
      setAttemptResult(result);
      setViewMode('RESULT');
      loadAssessments();
    } catch (err: any) {
      alert(`Submission failed: ${err.message || err}`);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* View Mode 1: Assessment List */}
      {viewMode === 'LIST' && (
        <>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
                Assessments & AI Practice Quizzes
              </h2>
              <p className="text-xs text-slate-500">
                Generate tailored multiple-choice, true/false, and short-answer tests from uploaded PDFs or syllabus topics.
              </p>
            </div>

            <button
              onClick={() => setViewMode('CREATE')}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:from-emerald-700 hover:to-teal-700 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Create New Assessment</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {assessments.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-emerald-100 bg-white p-10 text-center shadow-xs">
                <GraduationCap className="mx-auto h-12 w-12 text-emerald-400" />
                <h3 className="mt-3 text-sm font-bold text-slate-900">No assessments generated yet</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Upload lecture notes or enter a subject topic to generate your first intelligent assessment!
                </p>
                <button
                  onClick={() => setViewMode('CREATE')}
                  className="mt-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:from-emerald-700 hover:to-teal-700"
                >
                  Generate Quiz Now
                </button>
              </div>
            ) : (
              assessments.map((a) => (
                <div
                  key={a.id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:border-emerald-200 hover:shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        {a.assessment_type}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500">{a.difficulty}</span>
                    </div>

                    <h3 className="mt-3 text-sm font-bold text-slate-900">{a.title}</h3>
                    <p className="mt-1 text-xs text-slate-600">Topic: {a.subject_topic}</p>

                    <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5 text-slate-400" />
                        {a.question_count} Questions
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {a.time_limit_minutes > 0 ? `${a.time_limit_minutes}m` : 'Untimed'}
                      </span>
                    </div>

                    {/* Latest Score Badge */}
                    <div className="mt-3 border-t border-slate-100 pt-3">
                      {a.latest_percentage !== null && a.latest_percentage !== undefined ? (
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-slate-500">Latest Score:</span>
                          <span
                            className={`font-mono text-xs font-bold ${
                              a.latest_percentage >= 60 ? 'text-emerald-700' : 'text-rose-600'
                            }`}
                          >
                            {a.latest_percentage}% {a.latest_percentage < 60 ? '(Needs Revision)' : 'Passed'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">Not attempted yet</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-2">
                    <button
                      onClick={() => startTakingAssessment(a)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-50 py-2.5 text-xs font-bold text-sky-800 border border-sky-200 transition-colors hover:bg-sky-600 hover:text-white"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>{a.attempts_count > 0 ? 'Retake Quiz' : 'Start Assessment'}</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* View Mode 2: Create Assessment */}
      {viewMode === 'CREATE' && (
        <div className="mx-auto max-w-2xl rounded-3xl border border-emerald-100 bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Generate AI Assessment</h3>
              <p className="text-xs text-slate-500">
                Upload your lecture notes/PDF or enter your subject curriculum topic.
              </p>
            </div>
            <button
              onClick={() => setViewMode('LIST')}
              className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
            >
              Back to List
            </button>
          </div>

          <form onSubmit={handleGenerate} className="mt-6 space-y-4">
            {/* File Upload Dropzone */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Upload Study Material (PDF or TXT)
              </label>
              <div className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-emerald-200 bg-[#f7faf8] p-6 text-center hover:border-emerald-400 transition-colors">
                <Upload className="h-8 w-8 text-emerald-600" />
                <p className="mt-2 text-xs font-bold text-slate-800">
                  {uploadFileName ? uploadFileName : 'Drag & drop or click to upload lecture notes'}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">Supports PDF and TXT text extraction</p>
                <input
                  type="file"
                  accept=".pdf,.txt"
                  onChange={handleFileUpload}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
              </div>
              {uploading && (
                <p className="mt-1 text-xs text-emerald-700 font-semibold animate-pulse">Extracting text content from document...</p>
              )}
            </div>

            {/* Subject Topic */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Subject or Topic *</label>
              <input
                type="text"
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Memory Management & Paging Algorithms"
                className="w-full rounded-xl border border-slate-200 bg-[#f7faf8] px-3 py-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Assessment Title */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Assessment Title (Optional)</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Operating Systems Chapter 5 Review"
                className="w-full rounded-xl border border-slate-200 bg-[#f7faf8] px-3 py-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Format</label>
                <select
                  value={assessmentType}
                  onChange={(e) => setAssessmentType(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-[#f7faf8] px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="MCQ">Multiple Choice</option>
                  <option value="TRUE_FALSE">True / False</option>
                  <option value="SHORT_ANSWER">Short Answer</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-[#f7faf8] px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Questions</label>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-[#f7faf8] px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                >
                  <option value={5}>5 Questions</option>
                  <option value={10}>10 Questions</option>
                  <option value={15}>15 Questions</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Time Limit</label>
                <select
                  value={timeLimitMinutes}
                  onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-[#f7faf8] px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                >
                  <option value={5}>5 Minutes</option>
                  <option value={10}>10 Minutes</option>
                  <option value={15}>15 Minutes</option>
                  <option value={0}>Untimed</option>
                </select>
              </div>
            </div>

            {/* Paste Notes */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Or Paste Notes Directly (Optional)
              </label>
              <textarea
                rows={3}
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Paste excerpts from syllabus, textbook definitions, or summary sheets..."
                className="w-full rounded-xl border border-slate-200 bg-[#f7faf8] px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={generating || !topic.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:from-emerald-700 hover:to-teal-700 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all"
              >
                <Sparkles className="h-4 w-4" />
                <span>{generating ? 'Generating Questions with AI...' : 'Generate & Start Quiz'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* View Mode 3: Taking Assessment */}
      {viewMode === 'TAKE' && currentAssessment && (
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Top Bar with Countdown */}
          <div className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-white p-4 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900">{currentAssessment.title}</h3>
              <p className="text-xs text-slate-500">
                Question {currentQuestionIndex + 1} of {currentAssessment.questions.length}
              </p>
            </div>

            {currentAssessment.time_limit_minutes > 0 && (
              <div
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-mono font-bold ${
                  timeRemainingSeconds < 60
                    ? 'border-rose-300 bg-rose-50 text-rose-700 animate-pulse'
                    : 'border-sky-200 bg-sky-50 text-sky-800'
                }`}
              >
                <Clock className="h-4 w-4" />
                <span>{formatTimer(timeRemainingSeconds)}</span>
              </div>
            )}
          </div>

          {/* Question Palette Drawer */}
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-100 bg-white p-3 shadow-xs">
            {currentAssessment.questions.map((q, idx) => {
              const isAnswered = !!selectedAnswers[q.id];
              const isCurrent = idx === currentQuestionIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold transition-all ${
                    isCurrent
                      ? 'border-2 border-emerald-500 bg-emerald-600 text-white shadow-xs'
                      : isAnswered
                      ? 'border border-sky-300 bg-sky-50 text-sky-800'
                      : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Active Question Card */}
          {(() => {
            const q = currentAssessment.questions[currentQuestionIndex];
            if (!q) return null;

            return (
              <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-bold text-emerald-800">Question #{q.question_number}</span>
                  <span className="font-semibold text-slate-500">{q.points} Mark</span>
                </div>

                <h4 className="text-base font-semibold leading-relaxed text-slate-900">
                  {q.question_text}
                </h4>

                {/* Answers / Options Selection */}
                <div className="mt-6 space-y-3">
                  {q.question_type === 'SHORT_ANSWER' ? (
                    <div>
                      <textarea
                        rows={4}
                        value={selectedAnswers[q.id] || ''}
                        onChange={(e) => handleSelectAnswer(q.id, e.target.value)}
                        placeholder="Write your explanation or theoretical response here..."
                        className="w-full rounded-2xl border border-slate-200 bg-[#f7faf8] p-4 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  ) : (
                    q.options.map((opt, oIdx) => {
                      const isSelected = selectedAnswers[q.id] === opt;
                      return (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={() => handleSelectAnswer(q.id, opt)}
                          className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left text-xs transition-all ${
                            isSelected
                              ? 'border-2 border-emerald-500 bg-emerald-50/80 text-emerald-950 font-semibold shadow-xs'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-[#f9fbf9]'
                          }`}
                        >
                          <div
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold ${
                              isSelected
                                ? 'border-emerald-500 bg-emerald-600 text-white'
                                : 'border-slate-300 text-slate-500 bg-slate-50'
                            }`}
                          >
                            {String.fromCharCode(65 + oIdx)}
                          </div>
                          <span>{opt}</span>
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Navigation & Submit Controls */}
                <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-4">
                  <button
                    onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                    disabled={currentQuestionIndex === 0}
                    className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-30"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Previous</span>
                  </button>

                  {currentQuestionIndex < currentAssessment.questions.length - 1 ? (
                    <button
                      onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                      className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:from-emerald-700 hover:to-teal-700"
                    >
                      <span>Next</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmitAssessment}
                      disabled={submitting}
                      className="rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                    >
                      {submitting ? 'Submitting & Grading...' : 'Finish & Submit Assessment'}
                    </button>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* View Mode 4: Scorecard & Remediation */}
      {viewMode === 'RESULT' && attemptResult && (
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Main Scorecard Banner */}
          <div
            className={`rounded-3xl border p-8 text-center shadow-md ${
              attemptResult.is_passed
                ? 'border-emerald-200 bg-gradient-to-b from-[#f0fdf4] to-white text-emerald-950'
                : 'border-rose-200 bg-gradient-to-b from-[#fff1f2] to-white text-rose-950'
            }`}
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white border border-slate-200 shadow-sm">
              {attemptResult.is_passed ? (
                <Award className="h-8 w-8 text-emerald-600" />
              ) : (
                <AlertTriangle className="h-8 w-8 text-rose-500" />
              )}
            </div>

            <h3 className="mt-4 text-2xl font-bold text-slate-900">
              {attemptResult.is_passed ? 'Assessment Passed! 🎉' : 'Revision Required ⚠️'}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {attemptResult.is_passed
                ? 'Great job demonstrating mastery over this topic!'
                : 'You scored below the 60% passing threshold. Follow the AI revision plan below.'}
            </p>

            <div className="mt-6 flex justify-center gap-6 text-center">
              <div>
                <div className="text-3xl font-black text-slate-900">{attemptResult.percentage}%</div>
                <div className="text-[11px] font-semibold text-slate-500">Total Percentage</div>
              </div>
              <div className="border-r border-slate-200" />
              <div>
                <div className="text-3xl font-black text-slate-900">
                  {attemptResult.score_obtained} / {attemptResult.total_possible_score}
                </div>
                <div className="text-[11px] font-semibold text-slate-500">Marks Obtained</div>
              </div>
              <div className="border-r border-slate-200" />
              <div>
                <div className="text-3xl font-black text-slate-900">{attemptResult.time_spent_seconds}s</div>
                <div className="text-[11px] font-semibold text-slate-500">Time Spent</div>
              </div>
            </div>

            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => setViewMode('LIST')}
                className="rounded-xl bg-slate-100 px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
              >
                Back to Assessments
              </button>
              {currentAssessment && (
                <button
                  onClick={() => startTakingAssessment(currentAssessment)}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:from-emerald-700 hover:to-teal-700"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Retake Assessment</span>
                </button>
              )}
            </div>
          </div>

          {/* AI Revision Plan (If Failed or Weak) */}
          {attemptResult.revision_plan && (
            <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-6 shadow-sm">
              <div className="flex items-center gap-2 text-amber-900">
                <Sparkles className="h-5 w-5 text-amber-600" />
                <h4 className="text-sm font-bold">Personalized 3-Step AI Revision Plan</h4>
              </div>
              <p className="mt-1 text-xs text-amber-800">
                To improve your score in {attemptResult.subject_topic}, complete the following study exercises:
              </p>
              <div className="mt-4 space-y-2.5">
                {attemptResult.revision_plan.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 rounded-xl border border-amber-200/80 bg-white p-3.5 text-xs text-slate-700 shadow-xs"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-800">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Question Review */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-900">Question Review & Explanations</h4>
            {attemptResult.questions.map((qr) => (
              <div
                key={qr.question_id}
                className={`rounded-2xl border p-5 shadow-xs ${
                  qr.is_correct
                    ? 'border-emerald-200 bg-white'
                    : 'border-rose-200 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-xs font-semibold text-slate-500">
                    Question #{qr.question_number}
                  </span>
                  <span
                    className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      qr.is_correct
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {qr.is_correct ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    {qr.is_correct ? 'Correct' : 'Incorrect'} ({qr.points_awarded} pt)
                  </span>
                </div>

                <p className="mt-2 text-xs font-semibold text-slate-900">{qr.question_text}</p>

                <div className="mt-3 space-y-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Your Answer:</span>
                    <span className={qr.is_correct ? 'text-emerald-700 font-semibold' : 'text-rose-600 font-semibold'}>
                      {qr.student_answer || '(No answer provided)'}
                    </span>
                  </div>
                  {!qr.is_correct && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">Correct Answer:</span>
                      <span className="font-semibold text-emerald-800">{qr.correct_answer}</span>
                    </div>
                  )}
                </div>

                {qr.explanation && (
                  <div className="mt-3 rounded-xl border border-sky-100 bg-sky-50/70 p-3 text-[11px] text-sky-950">
                    <span className="font-bold text-sky-900">Explanation: </span>
                    {qr.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
