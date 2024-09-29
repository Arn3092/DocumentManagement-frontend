import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import '../../components/common/customQuill.css'
import { modules } from "../../components/common/quillModule.js"
import { toast } from 'react-toastify'; 
// import { pdfIcon, textIcon, docxIcon } from "../../assets/index.js";
import { createMeetingReport, createRotaractMeetingDraft, deleteRotaractMeetingDraft } from '../../store/rotaractMemberSlice/index.js';




const initialState = {
  facultyName: '',
  venue: '',
  meetingType: '',
  startDate: '',
  endDate: '',
  meetingSummary:'',
  income: '',
  expense: '',
  profit: '',
  loss: '',
  rotarians: '',
  alumnus: '',
  interactors: '',
  otherGuests: '',
  otherClubMembers: '',
  otherPis:'',
  otherDistrictRotaractors: '',
  totalMembers: '',
  attendanceImageUrl: '',
  coverImageUrl: '',
  supportDocumentUrl: '',
  // isDraft: false,
};

const RotaractMeetingForm = () => {
  const [formData, setFormData] = useState(initialState);
  const [content, setContent] = useState("");
  const [isDraft, setIsDraft] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const {draftData} = location.state || {}

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    let newValue = value;

    if (newValue === '' || (newValue === '0' || Number(newValue) > 0)) {
        setFormData((prevState) => ({
        ...prevState,
        [name]: newValue,
        }));
    }

    setFormData((prevState) => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleDraft = async (e) => {
    const checked = e.target.checked;
    setIsDraft(checked);

    if(formData.meetingType === '' && checked){
      toast.error("Meeting Type is not provided")
      return;
    }

    const formDataToSave = new FormData();

    Object.keys(formData).forEach(key => {
        if (key !== 'meetingSummary') {
            formDataToSave.append(key, formData[key]);
        }
    });

    // console.log("Draft data to save:");
    // formDataToSave.forEach((value, key) => {
    //     console.log(`${key}: ${value}`);
    // });

    // Append projectAim, projectGroundwork, and feedbackList
    formDataToSave.append('meetingSummary', content);
    formDataToSave.append('isDraft', checked); 
    
    
    // console.log("Draft data to save:");
    // formDataToSave.forEach((value, key) => {
    //     console.log(`${key}: ${value}`);
    // });

    if(checked && draftData?.draftId){
        formDataToSave.append('draftId', draftData.draftId)
    }

    try {
        const actionResult = await dispatch(createRotaractMeetingDraft(formDataToSave));
        const response = actionResult.payload;

        if(response?.success && response.statusCode === 201){
            if (checked) {
                toast.success("Draft saved successfully!!! It will be automatically deleted in 7 days");
                navigate('/member/rotaract-member/meetings');
            } 
        }
        if (response?.success && response.statusCode === 200) { // Check for successful status code
            if (checked) {
                toast.success("Draft updated successfully!!!");
                navigate('/member/rotaract-member/meetings');
            } 
        } 
        // console.log("response: ", response);
    } catch (error) {
        console.error("Failed to save or remove draft:", error);
    }
  };

  const handleDraftDelete = async (draftId) => {
      // console.log("draftId from delete: ", draftId)
      try {
          toast.success("Draft Project has been deleted successfully...")
          await dispatch(deleteRotaractMeetingDraft(draftId));
      } catch (err) {
          toast.error("Failed to delete draft", err);
      }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    // console.log("Into the submit!!!")
    e.preventDefault();
    
    if (!content.trim()) {
      toast.error('Required data is not filled!');
      return;
    }

    const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length;

    if(wordCount > 200 ) {
      toast.error('Content exceeds the 200-word limit. Please shorten your text.');
      return;
    }

    // console.log("meeting summary: ", content)
    // console.log("Everything is correct")
    try {
      // console.log("into the try Block")
      const formDataToSubmit = new FormData();
  
      Object.keys(formData).forEach(key => {
        if (key !== 'meetingSummary') {
          formDataToSubmit.append(key, formData[key]);
        }
      });
      
      formDataToSubmit.append('meetingSummary', content);
      
      const actionResult = await dispatch(createMeetingReport(formDataToSubmit));
      const response = actionResult.payload;
      // console.log("form data: ", response);
      // console.log("form data success: ", response?.success);
      
      // console.log("data is send to backend")

      if (response?.success && response.statusCode === 201) {
        navigate('/member/rotaract-member/meetings');
        if(draftData?.draftId){
          handleDraftDelete(draftData.draftId)
        }
        toast.success("The form has been successfully submitted")
      } else {
        toast.error(response?.message || "Submission failed!");
      }
    } catch (error) {
      // console.log("I am in catch block: ",error)
      toast.error("An error occurred during submission.");
    }
  };
  
  
  useEffect(() => {
    const now = new Date().toISOString().slice(0, 16); 
    setFormData((prevState) => ({
      ...prevState,
      startDate: prevState.startDate || now,
      endDate: prevState.endDate || now,
    }));
  }, []);

  useEffect(() => {
    const profitValue = formData.income - formData.expense;
    setFormData((prevState) => ({
      ...prevState,
      profit: profitValue >= 0 ? profitValue : 0,
      loss: profitValue < 0 ? Math.abs(profitValue) : 0,
    }));
  }, [formData.income, formData.expense]);

  useEffect(() => {
    const totalMembers = Number(formData.rotarians) + Number(formData.alumnus) + Number(formData.interactors) + Number(formData.otherGuests) + Number(formData.otherClubMembers) + Number(formData.otherPis) + Number(formData.otherDistrictRotaractors)
    setFormData((prevState) => ({
      ...prevState,
      totalMembers
    }))
  }, [formData.rotarians, formData.alumnus, formData.interactors, formData.otherGuests, formData.otherClubMembers, formData.otherPis, formData.otherDistrictRotaractors])
  
  const handleContentChange = (value) => {
    setContent(value);
  };

  const formatDateForInput = (dateString) => {
    const date = new Date(dateString);
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 16); // This will return "yyyy-MM-ddTHH:mm"
  };

  useEffect(() => {
    // Assuming draftData is the fetched draft object
    if (draftData) {
        setFormData({
            facultyName: draftData.facultyName,
            venue: draftData.venue,
            meetingType: draftData.meetingType,
            startDate: formatDateForInput(draftData.startDate), // Format for input
            endDate: formatDateForInput(draftData.endDate),
            income: draftData.income || 0,
            expense: draftData.expense || 0,
            profit: draftData.profit || 0,
            loss: draftData.loss || 0,
            rotarians: draftData.rotarians || 0,
            alumnus: draftData.alumnus || 0,
            interactors: draftData.interactors || 0,
            otherGuests: draftData.otherGuests || 0,
            otherClubMembers: draftData.otherClubMembers || 0,
            otherPis: draftData.otherPis || 0,
            otherDistrictRotaractors: draftData.otherDistrictRotaractors || 0,
            totalMembers: draftData.totalMembers || 0,
            coverImageUrl: draftData.coverImageUrl,
            attendanceImageUrl: draftData.attendanceImageUrl,
            supportDocumentUrl: draftData.supportDocumentUrl,
        });
        setContent(draftData.meetingSummary);
    }
  }, [draftData]);

  return (
    <form className="p-8 m-8 bg-white shadow-[0px_4px_12px_rgba(0,0,0,0.2)] rounded-lg overflow-hidden" onSubmit={handleSubmit}>
      {/* Faculty, Venue, Meeting Type */}
      <p className='font-bold mb-4 text-xl'>New Meeting Report</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {['Faculty Name', 'Venue', 'Meeting Type'].map((placeholder, index) => {
          const name = ['facultyName', 'venue', 'meetingType']
        return (
          <div key={index} className="relative">
            <label className="block text-gray-700">
              {placeholder}<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name={name[index]}
              value={formData[name[index]]}
              onChange={handleChange}
              placeholder={placeholder}
              required
              className="w-full border-b border-gray-300 bg-transparent py-2 px-1 focus:outline-none focus:border-green-500 transition-colors"
            />
          </div>
        )})}
        {/* <div className="relative">
          <label className="block">Meeting Type<span className="text-red-500">*</span></label>
          <select name={'meetingType'} required onChange={handleChange} className='w-full border-b border-gray-300 bg-transparent py-2 px-1 focus:outline-none focus:border-green-500 transition-colors'>
            <option value="select" disabled selected className='text-gray-600'>Meeting Type</option>
            <option value="GBM">GBM</option>
            <option value="BOD">BOD</option>
            <option value="Joint Meeting">Joint Meetings</option>
            <option value="PIS Expectations">PIS Expectations</option>
            <option value="OCV">OCV</option>
            <option value="Letterhead Exchange">Letterhead Exchange</option>
            <option value="Any other">Anyother</option>
          </select>
        </div> */}
      </div>

      {/* Start & End Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {['Start Date', 'End Date'].map((label, index) => {
          const name= ['startDate', 'endDate']
          return (
          <div key={index} className="space-y-1">
            <label className="block text-gray-700">{label}<span className="text-red-500">*</span></label>
            <input
              type="datetime-local"
              name={name[index]}
              value={formData[name[index]]}
              onChange={handleChange}
              required
              className="w-full border-b border-gray-300 bg-transparent py-2 px-1 focus:outline-none focus:border-green-500 transition-colors"
            />
          </div>
        )})}
      </div>

      {/**form type */}
      <div className='flex gap-2'>
        <input 
          type="checkbox" 
          name="isDraft"
          checked={isDraft}  
          onChange={handleDraft} 
        />
        <label>Save report as Draft?</label>
      </div>

      {/** Minutes of Meeting */}
      <div className="quill-container space-y-4 mb-6 mt-8">
        <p className="text-2xl font-semibold">Minutes of Meetings?<span className="text-red-500">*</span></p>
        {/* <RichTextEditor name={'meetingSummary'} content={content} setContent={setContent} /> */}
        {/* <Editor
          editorState={content}
          onEditorStateChange={setContent}
        /> */}
        <ReactQuill 
          value={content} 
          onChange={handleContentChange} 
          modules={modules}
          className="custom-quill border rounded-lg shadow-md"
        />
        <p className='text-gray-400 text-sm right-0 text-end'>{`${content.trim().split(/\s+/).filter(word => word.length > 0).length}/250 words`}</p>
      </div>

      {/* Meeting Finance */}
      <div className="space-y-4 mb-6">
        <p className="font-semibold text-2xl">Meeting Finance</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[ 'Income', 'expense'].map((label, index) => {
            const name = ['income', 'expense']
            return (
            <div key={index} className="relative">
              <label className="block text-gray-700">{label}<span className="text-red-500">*</span></label>
              <input
                type="number"
                name={name[index]}
                value={formData[name[index]]}
                onChange={handleChange}
                placeholder="0"
                min="0" 
                step="1"
                className="w-full border-b border-gray-300 bg-transparent py-2 px-1 focus:outline-none focus:border-green-500 transition-colors"
              />
            </div>
          )})}
          {['Profit', 'loss'].map((label, index) => {
            const name = ['profit', 'loss']
            return (
            <div key={index} className="relative">
              <label className="block text-gray-700">{label}<span className="text-red-500">*</span></label>
              <input
                type="number"
                name={name[index]}
                value={formData[name[index]]}
                onChange={handleChange}
                readOnly
                placeholder="0"
                className="w-full border-b border-gray-300 bg-transparent py-2 px-1 focus:outline-none focus:border-green-500 transition-colors"
              />
            </div>
          )})}
        </div>
      </div>

      {/* Members Information */}
      <div className="space-y-4 mb-6">
        <p className="font-semibold text-2xl">
          Members Information
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {['Rotarians', 'Alumnus', 'Interactors', 'Other Guests', 'Other Club Members', 'Other PIS', 'Other District Rotaractors', 'Total'].map((label, index) =>{
            const name = ['rotarians', 'alumnus', 'interactors', 'otherGuests', 'otherClubMembers', 'otherPis', 'otherDistrictRotaractors', 'totalMembers']
            return (
            <div key={index} className="relative">
              <label className="block text-gray-700">{label}<span className="text-red-500">*</span></label>
              <input
                  type="number"
                  name={name[index]}
                  value={formData[name[index]]}
                  onChange={handleChange}
                  required
                  placeholder="0"
                  min="0" 
                  step="1"
                  className="w-full border-b border-gray-300 bg-transparent py-2 px-1 focus:outline-none focus:border-green-500 transition-colors"
                />
            </div>
          )})}
          {/* {['Total'].map((label, index) => {
            const name = ["totalMembers"]
            return (
              <div key={index} className="relative">
                <label className="block text-gray-700">{label}</label>
                <input
                  type="number"
                  name={name[index]}
                  value={formData[name[index]]}
                  onChange={handleChange}
                  readOnly
                  placeholder="0"
                  className="w-full border-b border-gray-300 bg-transparent py-2 px-1 focus:outline-none focus:border-green-500 transition-colors"
                />
              </div>
          )})} */}
        </div>
      </div>


      {/* Support Documents */}
      <div className="space-y-4 mb-6">
        <p className="font-semibold text-2xl">Support Documents</p>

        {/* Cover Image URL Input */}
        <div className="relative">
          <label className="block text-gray-700">Cover Image URL<span className="text-red-500">*</span></label>
          <input
            type="text"
            name="coverImageUrl"
            placeholder="Enter image URL"
            required
            value={formData.coverImageUrl}
            onChange={(e) => handleChange(e, 'coverImageUrl')}
            className="w-[50%] border-b border-gray-300 bg-transparent py-2 px-1 focus:outline-none focus:border-green-500 transition-colors"
          />
          {/* {coverImageUrl && (
            <img
              src={coverImageUrl}
              alt="Cover Preview"
              className="mt-4 w-40 h-40 object-contain"
            />
          )} */}
        </div>

        {/* Attendance Image URL Input */}
        <div className="relative">
          <label className="block text-gray-700">Attendance Image URL<span className="text-red-500">*</span></label>
          <input
            type="text"
            name="attendanceImageUrl"
            placeholder="Enter image URL"
            required
            value={formData.attendanceImageUrl}
            onChange={(e) => handleChange(e, 'attendanceImageUrl')}
            className="w-[50%] border-b border-gray-300 bg-transparent py-2 px-1 focus:outline-none focus:border-green-500 transition-colors"
          />
          {/* {attendanceUrl && (
            <img
              src={attendanceUrl}
              alt="Attendance Preview"
              className="mt-4 w-40 h-40 object-contain"
            />
          )} */}
        </div>

        {/* Support Document URL Input */}
        <div className="relative">
          <label className="block text-gray-700">Support Document URL (Image or Document)<span className="text-red-500">*</span></label>
          <input
            type="text"
            name="supportDocumentUrl"
            placeholder="Enter document URL"
            value={formData.supportDocumentUrl}
            onChange={(e) => handleChange(e, 'supportDocumentUrl')}
            className="w-[50%] border-b border-gray-300 bg-transparent py-2 px-1 focus:outline-none focus:border-green-500 transition-colors"
          />
          
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <Link to='/member/rotaract-member/meetings'>
          <button
            type="button"
            className="px-4 py-2 bg-white text-gray-500 border-2 border-gray-500 rounded-lg hover:bg-gray-500 hover:text-white"
          >
            Cancel
          </button>
        </Link>
        <button
          type="submit"
          className="px-4 py-2 bg-white text-green-500 border-2 border-green-500 rounded-lg hover:bg-green-500 hover:text-white"
        >
          Submit
        </button>
      </div>
    </form>
  );
};

export default RotaractMeetingForm;