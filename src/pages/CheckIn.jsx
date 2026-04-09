import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Phone, Camera, Upload, X, Check, ChevronLeft, Loader2, RefreshCw, BedDouble, ShieldCheck, ShieldX, FlipHorizontal } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRooms } from '../hooks/useRooms'
import { useGuests } from '../hooks/useGuests'
import { useBookings } from '../hooks/useBookings'
import { uploadToCloudinary, dataURLtoBlob } from '../lib/cloudinary'
import { validateMobile, validateID } from '../lib/validators'
import { roomTypeLabel, todayISO, formatINR } from '../lib/formatters'
import Spinner from '../components/ui/Spinner'
import MobileVerification from '../components/ui/MobileVerification'

const STEPS = ['Room & Rate', 'Guest Details', 'Review & Confirm']

const TYPE_LABELS = {
  non_ac_standard: 'Non-AC Standard',
  non_ac_deluxe: 'Non-AC Deluxe',
  ac_standard: 'AC Standard',
  ac_deluxe: 'AC Deluxe',
}

const ID_TYPES = [
  { value: 'aadhaar', label: 'Aadhaar' },
  { value: 'pan', label: 'PAN Card' },
  { value: 'passport', label: 'Passport' },
  { value: 'driving_license', label: 'Driving License' },
  { value: 'voter_id', label: 'Voter ID' },
]

function RoomCard({ room, selected, onSelect }) {
  const isSelected = selected?.id === room.id
  return (
    <button
      onClick={() => onSelect(room)}
      className={`card p-3 text-left transition-all active:scale-95 ${isSelected ? 'ring-2 ring-brand/30' : ''}`}
      style={{ borderColor: isSelected ? '#6C8EF7' : undefined }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold text-base">Room {room.room_number}</span>
        {isSelected && <Check size={16} className="text-brand" />}
      </div>
      <span className="text-xs px-2 py-0.5 rounded-full bg-brand/10 text-brand font-medium">
        {TYPE_LABELS[room.room_type]}
      </span>
      <div className="mt-2 flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
        <span>Floor {room.floor}</span>
        <span>₹{room.base_rate}/night</span>
      </div>
    </button>
  )
}

export default function CheckIn() {
  const navigate = useNavigate()
  const { rooms, loading: roomsLoading } = useRooms()
  const { addGuest } = useGuests()
  const { createBooking } = useBookings()

  const [step, setStep] = useState(0)
  const [filter, setFilter] = useState('all')

  // Step 1
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [rate, setRate] = useState('')
  const [deposit, setDeposit] = useState('')
  const [checkInDate, setCheckInDate] = useState(todayISO())
  const [notes, setNotes] = useState('')

  // Step 2
  const [fullName, setFullName] = useState('')
  const [mobile, setMobile] = useState('')
  const [mobileVerified, setMobileVerified] = useState(false)
  const [mobileSkipped, setMobileSkipped] = useState(false)
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [idType, setIdType] = useState('aadhaar')
  const [idNumber, setIdNumber] = useState('')
  const [idDocUrl, setIdDocUrl] = useState('')
  const [livePhotoUrl, setLivePhotoUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [idThumb, setIdThumb] = useState('')
  const [photoThumb, setPhotoThumb] = useState('')

  // Camera state
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraTarget, setCameraTarget] = useState('id')   // 'id' | 'photo'
  const [facingMode, setFacingMode] = useState('environment') // 'user' | 'environment'
  const [cameraError, setCameraError] = useState('')
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const fileIdRef = useRef(null)
  const filePhotoRef = useRef(null)

  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  const mobileIsValid = !validateMobile(mobile)

  const vacantRooms = rooms.filter(r => r.status === 'vacant')
  const filteredRooms = filter === 'all' ? vacantRooms
    : filter === 'ac' ? vacantRooms.filter(r => r.room_type.startsWith('ac'))
    : vacantRooms.filter(r => r.room_type.startsWith('non'))

  const handleSelectRoom = (room) => {
    setSelectedRoom(room)
    setRate(room.base_rate)
    setDeposit(room.default_deposit)
  }

  const validateStep1 = () => {
    const e = {}
    if (!selectedRoom) e.room = 'Please select a room'
    if (!rate || rate <= 0) e.rate = 'Enter a valid rate'
    if (!deposit || deposit < 0) e.deposit = 'Enter a valid deposit'
    if (!checkInDate) e.checkInDate = 'Check-in date required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const validateStep2 = () => {
    const e = {}
    if (!fullName.trim()) e.fullName = 'Full name required'
    const mobileErr = validateMobile(mobile)
    if (mobileErr) e.mobile = mobileErr
    if (!address.trim()) e.address = 'Address required'
    const idErr = validateID(idType, idNumber)
    if (idErr) e.idNumber = idErr
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const nextStep = () => {
    if (step === 0 && !validateStep1()) return
    if (step === 1 && !validateStep2()) return
    setStep(s => s + 1)
  }

  const handleMobileChange = (val) => {
    setMobile(val)
    if (mobileVerified || mobileSkipped) {
      setMobileVerified(false)
      setMobileSkipped(false)
    }
    setErrors(e => ({ ...e, mobile: undefined }))
  }

  const handleFileUpload = async (file, target) => {
    if (!file) return
    const isId = target === 'id'
    if (isId) setUploading(true); else setUploadingPhoto(true)
    try {
      const url = await uploadToCloudinary(file)
      if (isId) { setIdDocUrl(url); setIdThumb(url) }
      else { setLivePhotoUrl(url); setPhotoThumb(url) }
      toast.success(isId ? 'ID document uploaded' : 'Photo uploaded')
    } catch {
      toast.error('Failed to upload. Please try again.')
    } finally {
      if (isId) setUploading(false); else setUploadingPhoto(false)
    }
  }

  // Start camera stream with a given facingMode
  const startStream = async (target, facing) => {
    // Stop any existing stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing }
      })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setCameraError('')
    } catch {
      // Some devices don't have both cameras — fall back gracefully
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
        setCameraError('')
      } catch {
        setCameraError('Camera not accessible. Please upload a photo manually.')
        streamRef.current = null
      }
    }
  }

  // Open camera — default facing depends on target
  const openCamera = async (target) => {
    const defaultFacing = target === 'photo' ? 'user' : 'environment'
    setCameraTarget(target)
    setFacingMode(defaultFacing)
    setCameraError('')
    setCameraOpen(true)
    await startStream(target, defaultFacing)
  }

  // Flip between front and back camera
  const flipCamera = async () => {
    const newFacing = facingMode === 'user' ? 'environment' : 'user'
    setFacingMode(newFacing)
    await startStream(cameraTarget, newFacing)
  }

  const closeCamera = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setCameraOpen(false)
    setCameraError('')
  }

  const capturePhoto = async () => {
    if (!videoRef.current) return
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    // Mirror the image if using front camera (selfie)
    const ctx = canvas.getContext('2d')
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(videoRef.current, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    closeCamera()
    const blob = dataURLtoBlob(dataUrl)
    const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' })
    await handleFileUpload(file, cameraTarget)
  }

  const handleConfirm = async () => {
    setSubmitting(true)
    try {
      const guest = await addGuest({
        full_name: fullName.trim(),
        mobile,
        is_mobile_verified: mobileVerified,
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        id_type: idType,
        id_number: idNumber.trim(),
        id_document_url: idDocUrl,
        live_photo_url: livePhotoUrl,
      })
      await createBooking({
        room: selectedRoom,
        guest,
        rate: parseFloat(rate),
        deposit: parseFloat(deposit),
        checkInDate,
        notes: notes.trim(),
      })
      toast.success('Guest checked in successfully!')
      navigate('/')
    } catch (err) {
      if (err.message?.includes('fetch') || err.message?.includes('network')) {
        toast.error('No internet. Please check your connection and try again.')
      } else {
        toast.error(err.message || 'Check-in failed. Please try again.')
      }
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const mobileVerificationStatus = () => {
    if (mobileVerified) return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
        <ShieldCheck size={13} className="text-green-600" />
        <span className="text-xs font-medium text-green-700 dark:text-green-400">Verified</span>
      </div>
    )
    if (mobileSkipped) return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
        <ShieldX size={13} className="text-amber-600" />
        <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Not Verified</span>
      </div>
    )
    return null
  }

  return (
    <div className="page-container max-w-2xl">
      {/* Header + progress */}
      <div className="mb-5">
        <h1 className="font-display text-xl font-semibold">New Check-in</h1>
        <div className="flex items-center gap-2 mt-3">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold transition-all ${i < step ? 'bg-green-500 text-white' : i === step ? 'bg-brand text-white' : 'bg-black/10 dark:bg-white/10'}`}>
                {i < step ? <Check size={12} /> : i + 1}
              </div>
              <span className="text-xs font-medium hidden sm:block" style={{ color: i === step ? '#6C8EF7' : 'var(--text-muted)' }}>{s}</span>
              {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 rounded ${i < step ? 'bg-green-500' : 'bg-black/10 dark:bg-white/10'}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* ── STEP 1: Room & Rate ── */}
      {step === 0 && (
        <div className="fade-in space-y-4">
          <div className="flex gap-2">
            {[{ value: 'all', label: 'All' }, { value: 'non_ac', label: 'Non-AC' }, { value: 'ac', label: 'AC' }].map(f => (
              <button key={f.value} onClick={() => setFilter(f.value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === f.value ? 'bg-brand text-white' : 'card'}`}>
                {f.label}
              </button>
            ))}
          </div>

          {roomsLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : filteredRooms.length === 0 ? (
            <div className="card p-6 text-center">
              <BedDouble size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No vacant rooms in this category</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredRooms.map(r => <RoomCard key={r.id} room={r} selected={selectedRoom} onSelect={handleSelectRoom} />)}
            </div>
          )}
          {errors.room && <p className="text-xs text-red-500">{errors.room}</p>}

          {selectedRoom && (
            <div className="card p-4 space-y-3 fade-in">
              <p className="text-sm font-semibold">Booking Details — Room {selectedRoom.room_number}</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Rate per night (₹)</label>
                  <input type="number" className="input-field" value={rate} onChange={e => setRate(e.target.value)} min="0" />
                  {errors.rate && <p className="text-xs text-red-500 mt-1">{errors.rate}</p>}
                </div>
                <div>
                  <label className="label">Deposit (₹)</label>
                  <input type="number" className="input-field" value={deposit} onChange={e => setDeposit(e.target.value)} min="0" />
                  {errors.deposit && <p className="text-xs text-red-500 mt-1">{errors.deposit}</p>}
                </div>
              </div>
              <div>
                <label className="label">Check-in Date</label>
                <input type="date" className="input-field" value={checkInDate} onChange={e => setCheckInDate(e.target.value)} />
              </div>
              <div>
                <label className="label">Notes (optional)</label>
                <textarea className="input-field" rows={2} placeholder="Any special requests…" value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── STEP 2: Guest Details ── */}
      {step === 1 && (
        <div className="fade-in space-y-3">
          <div>
            <label className="label">Full Name *</label>
            <input className="input-field" placeholder="Rajesh Kumar" value={fullName} onChange={e => setFullName(e.target.value)} />
            {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
          </div>

          {/* Mobile + OTP */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label mb-0">Mobile Number *</label>
              {mobileVerificationStatus()}
            </div>
            <div className="relative mb-2">
              <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input
                className="input-field pl-9"
                placeholder="9876543210"
                value={mobile}
                onChange={e => handleMobileChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
                type="tel"
                maxLength={10}
              />
            </div>
            {errors.mobile && <p className="text-xs text-red-500 mb-2">{errors.mobile}</p>}
            {mobileIsValid && !mobileVerified && !mobileSkipped && (
              <MobileVerification
                mobile={mobile}
                onVerified={() => { setMobileVerified(true); setMobileSkipped(false) }}
                onSkip={() => { setMobileSkipped(true); setMobileVerified(false) }}
                disabled={!mobileIsValid}
              />
            )}
          </div>

          <div>
            <label className="label">Address *</label>
            <textarea className="input-field" rows={2} placeholder="Street, Area" value={address} onChange={e => setAddress(e.target.value)} />
            {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">City</label>
              <input className="input-field" placeholder="Pune" value={city} onChange={e => setCity(e.target.value)} />
            </div>
            <div>
              <label className="label">State</label>
              <input className="input-field" placeholder="Maharashtra" value={state} onChange={e => setState(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">ID Type *</label>
              <select className="input-field" value={idType} onChange={e => setIdType(e.target.value)}>
                {ID_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">ID Number *</label>
              <input className="input-field"
                placeholder={idType === 'aadhaar' ? '123412341234' : idType === 'pan' ? 'ABCDE1234F' : 'Enter number'}
                value={idNumber}
                onChange={e => setIdNumber(e.target.value)} />
              {errors.idNumber && <p className="text-xs text-red-500 mt-1">{errors.idNumber}</p>}
            </div>
          </div>

          {/* ID Document */}
          <div className="card p-4">
            <p className="text-sm font-medium mb-1">ID Document</p>
            <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Opens back camera by default for scanning</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => openCamera('id')} className="btn-secondary flex items-center gap-2 flex-1 text-sm">
                <Camera size={15} /> Camera
              </button>
              <button type="button" onClick={() => fileIdRef.current?.click()} className="btn-secondary flex items-center gap-2 flex-1 text-sm">
                <Upload size={15} /> Upload
              </button>
              <input ref={fileIdRef} type="file" accept="image/*,application/pdf" className="hidden"
                onChange={e => handleFileUpload(e.target.files[0], 'id')} />
            </div>
            {uploading && <div className="flex items-center gap-2 mt-3"><Spinner size={16} /><span className="text-xs" style={{ color: 'var(--text-muted)' }}>Uploading…</span></div>}
            {idThumb && !uploading && (
              <div className="mt-3 relative inline-block">
                <img src={idThumb} alt="ID" className="w-24 h-16 object-cover rounded-xl border" style={{ borderColor: 'var(--border)' }} />
                <button onClick={() => { setIdDocUrl(''); setIdThumb('') }} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center">
                  <X size={10} />
                </button>
              </div>
            )}
          </div>

          {/* Live Photo */}
          <div className="card p-4">
            <p className="text-sm font-medium mb-1">Live Photo</p>
            <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Opens front camera by default — tap flip to switch</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => openCamera('photo')} className="btn-secondary flex items-center gap-2 flex-1 text-sm">
                <Camera size={15} /> Camera
              </button>
              <button type="button" onClick={() => filePhotoRef.current?.click()} className="btn-secondary flex items-center gap-2 flex-1 text-sm">
                <Upload size={15} /> Upload
              </button>
              <input ref={filePhotoRef} type="file" accept="image/*" className="hidden"
                onChange={e => handleFileUpload(e.target.files[0], 'photo')} />
            </div>
            {uploadingPhoto && <div className="flex items-center gap-2 mt-3"><Spinner size={16} /><span className="text-xs" style={{ color: 'var(--text-muted)' }}>Uploading…</span></div>}
            {photoThumb && !uploadingPhoto && (
              <div className="mt-3 relative inline-block">
                <img src={photoThumb} alt="Photo" className="w-16 h-16 object-cover rounded-xl border" style={{ borderColor: 'var(--border)' }} />
                <button onClick={() => { setLivePhotoUrl(''); setPhotoThumb('') }} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center">
                  <X size={10} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── STEP 3: Review ── */}
      {step === 2 && (
        <div className="fade-in space-y-4">
          <div className="card p-4 space-y-3">
            <p className="font-semibold text-sm mb-1">Booking Summary</p>
            {[
              ['Guest', fullName],
              ['Mobile', mobile],
              ['Mobile Status', null],
              ['Room', `${selectedRoom?.room_number} — ${TYPE_LABELS[selectedRoom?.room_type]}`],
              ['Floor', `Floor ${selectedRoom?.floor}`],
              ['Check-in', checkInDate],
              ['Rate/night', formatINR(rate)],
              ['Deposit', formatINR(deposit)],
              notes && ['Notes', notes],
            ].filter(Boolean).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{k}</span>
                {k === 'Mobile Status' ? (
                  mobileVerified
                    ? <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                        <ShieldCheck size={13} className="text-green-600" />
                        <span className="text-xs font-medium text-green-700 dark:text-green-400">Verified</span>
                      </div>
                    : <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                        <ShieldX size={13} className="text-amber-600" />
                        <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Not Verified</span>
                      </div>
                ) : (
                  <span className="text-sm font-medium text-right max-w-[60%]">{v}</span>
                )}
              </div>
            ))}
          </div>
          <div className="card p-4 space-y-2">
            <p className="font-semibold text-sm mb-1">Guest Details</p>
            {[
              ['ID Type', idType.toUpperCase()],
              ['ID Number', idNumber],
              ['Address', address],
              city && ['City', city],
              state && ['State', state],
            ].filter(Boolean).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{k}</span>
                <span className="text-sm font-medium">{v}</span>
              </div>
            ))}
          </div>
          {!mobileVerified && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs">
              <ShieldX size={14} className="flex-shrink-0 mt-0.5" />
              <span>Mobile not verified. You can still check in — verification status will be saved.</span>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 mt-6 sticky bottom-20 lg:bottom-4 pb-2">
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)} className="btn-secondary flex items-center gap-2">
            <ChevronLeft size={16} /> Back
          </button>
        )}
        {step < 2 ? (
          <button onClick={nextStep} disabled={uploading || uploadingPhoto} className="btn-primary flex-1">
            Next →
          </button>
        ) : (
          <button onClick={handleConfirm} disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {submitting
              ? <><Loader2 size={16} className="animate-spin" /> Checking in…</>
              : <><Check size={16} /> Confirm Check-in</>
            }
          </button>
        )}
      </div>

      {/* ── Camera Overlay ── */}
      {cameraOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
          {cameraError ? (
            <div className="text-white text-center p-8 space-y-4">
              <Camera size={48} className="mx-auto opacity-40" />
              <p className="text-sm">{cameraError}</p>
              <button onClick={closeCamera} className="btn-primary">Close</button>
            </div>
          ) : (
            <>
              {/* Camera label */}
              <div className="absolute top-6 left-0 right-0 flex items-center justify-center gap-2">
                <span className="text-white/70 text-xs font-medium px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm">
                  {cameraTarget === 'photo' ? '📸 Live Photo' : '🪪 ID Document'}
                  {' · '}
                  {facingMode === 'user' ? 'Front Camera' : 'Back Camera'}
                </span>
              </div>

              {/* Video — mirror front camera visually */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full max-w-sm rounded-xl"
                style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
              />

              {/* Controls */}
              <div className="flex gap-4 mt-6 items-center">
                {/* Close */}
                <button
                  onClick={closeCamera}
                  className="w-11 h-11 rounded-xl border border-white/30 flex items-center justify-center text-white active:scale-95 transition-transform"
                  title="Cancel"
                >
                  <X size={18} />
                </button>

                {/* Capture */}
                <button
                  onClick={capturePhoto}
                  className="w-16 h-16 rounded-full bg-white flex items-center justify-center active:scale-95 transition-transform shadow-lg"
                  title="Capture"
                >
                  <Camera size={24} className="text-black" />
                </button>

                {/* Flip camera toggle */}
                <button
                  onClick={flipCamera}
                  className="w-11 h-11 rounded-xl border border-white/30 flex items-center justify-center text-white active:scale-95 transition-transform"
                  title={facingMode === 'user' ? 'Switch to back camera' : 'Switch to front camera'}
                >
                  <FlipHorizontal size={18} />
                </button>
              </div>

              {/* Flip hint */}
              <p className="text-white/40 text-xs mt-3">
                {facingMode === 'user' ? 'Front camera active' : 'Back camera active'} · tap <FlipHorizontal size={11} className="inline" /> to switch
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
