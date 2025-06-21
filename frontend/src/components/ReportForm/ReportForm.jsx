import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { 
  FileText, 
  Camera, 
  Send, 
  X, 
  AlertTriangle, 
  MapPin, 
  Upload,
  Loader2,
  Eye,
  Check,
  Shield,
  Clock
} from 'lucide-react';
import { useApi } from '../../hooks/useApi';

const ReportForm = ({ disaster, user }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { disasters } = useApi();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [verificationResults, setVerificationResults] = useState({});
  const [currentDisaster, setCurrentDisaster] = useState(disaster);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid }
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      content: '',
      image_url: '',
      priority: 'medium',
      contact_info: ''
    }
  });

  const watchedValues = watch();

  useEffect(() => {
    if (!currentDisaster && id) {
      loadDisaster();
    }
  }, [id, currentDisaster]);

  const loadDisaster = async () => {
    try {
      const response = await disasters.getById(id);
      if (response.success) {
        setCurrentDisaster(response.data);
      } else {
        toast.error('Disaster not found');
        navigate('/disasters');
      }
    } catch (error) {
      toast.error('Failed to load disaster details');
      navigate('/disasters');
    }
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      const newImages = imageFiles.map(file => ({
        id: Date.now() + Math.random(),
        file,
        preview: URL.createObjectURL(file),
        name: file.name,
        verified: false,
        uploading: false
      }));
      setUploadedImages(prev => [...prev, ...newImages]);
    }
  };

  const removeImage = (imageId) => {
    setUploadedImages(prev => {
      const image = prev.find(img => img.id === imageId);
      if (image) {
        URL.revokeObjectURL(image.preview);
      }
      return prev.filter(img => img.id !== imageId);
    });
    // Remove verification result
    setVerificationResults(prev => {
      const newResults = { ...prev };
      delete newResults[imageId];
      return newResults;
    });
  };

  const verifyImage = async (imageId) => {
    const image = uploadedImages.find(img => img.id === imageId);
    if (!image) return;

    setIsVerifying(true);
    try {
     
      const mockImageUrl = `https://example.com/images/${image.name}`;
      
      const response = await disasters.verifyImage(currentDisaster.id, {
        image_url: mockImageUrl,
        report_id: null 
      });

      if (response.success) {
        setVerificationResults(prev => ({
          ...prev,
          [imageId]: response.data.verification_result
        }));
        
        setUploadedImages(prev => 
          prev.map(img => 
            img.id === imageId ? { ...img, verified: true } : img
          )
        );
        
        toast.success('Image verification completed');
      } else {
        toast.error('Image verification failed');
      }
    } catch (error) {
      toast.error('Failed to verify image');
    } finally {
      setIsVerifying(false);
    }
  };

  const onSubmit = async (data) => {
    if (!currentDisaster) {
      toast.error('No disaster selected');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const reportData = {
        content: data.content,
        image_url: uploadedImages.length > 0 ? uploadedImages[0].preview : data.image_url,
        contact_info: data.contact_info,
        user_id: user?.id || 'citizen1'
      };

      const response = await disasters.addReport(currentDisaster.id, reportData);
      
      if (response.success) {
        toast.success('Report submitted successfully!');
        navigate(`/disasters`);
      } else {
        toast.error(response.error?.message || 'Failed to submit report');
      }
    } catch (error) {
      toast.error('Failed to submit report');
      console.error('Error creating report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getVerificationIcon = (result) => {
    if (!result) return null;
    
    if (result.is_authentic) {
      return <Check className="w-4 h-4 text-green-500" />;
    } else {
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }
  };

  const getVerificationColor = (result) => {
    if (!result) return 'border-gray-200';
    
    if (result.is_authentic && result.confidence > 0.7) {
      return 'border-green-500 bg-green-50';
    } else if (result.is_authentic) {
      return 'border-yellow-500 bg-yellow-50';
    } else {
      return 'border-red-500 bg-red-50';
    }
  };

  if (!currentDisaster) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="spinner-lg mx-auto mb-4"></div>
          <p className="text-gray-600">Loading disaster details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Submit Report</h1>
                <p className="text-sm text-gray-600">Add information about this disaster</p>
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => navigate('/disasters')}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

       
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">{currentDisaster.title}</h2>
              <p className="text-sm text-gray-600 mb-2">{currentDisaster.description}</p>
              
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                {currentDisaster.location_name && (
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>{currentDisaster.location_name}</span>
                  </div>
                )}
                
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>
                    {new Date(currentDisaster.created_at).toLocaleDateString()} at{' '}
                    {new Date(currentDisaster.created_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              {currentDisaster.tags && currentDisaster.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {currentDisaster.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-white text-gray-600 text-xs rounded border capitalize"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             
              <div className="space-y-6">
               
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Report Details *
                  </label>
                  <textarea
                    rows={6}
                    {...register('content', { 
                      required: 'Report content is required',
                      minLength: { value: 10, message: 'Report must be at least 10 characters' }
                    })}
                    className={`input-field resize-none ${errors.content ? 'input-field-error' : ''}`}
                    placeholder="Describe what you observed, current conditions, immediate needs, or additional information about this disaster..."
                  />
                  {errors.content && (
                    <p className="form-error">{errors.content.message}</p>
                  )}
                  <p className="form-help">
                    Provide detailed information about the current situation, resources needed, or updates
                  </p>
                </div>

                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Information (Optional)
                  </label>
                  <input
                    type="text"
                    {...register('contact_info')}
                    className="input-field"
                    placeholder="Phone number, email, or other contact details"
                  />
                  <p className="form-help">
                    Provide contact information if follow-up coordination is needed
                  </p>
                </div>

                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    {...register('image_url')}
                    className="input-field"
                    placeholder="https://example.com/disaster-image.jpg"
                  />
                  <p className="form-help">
                    Provide a direct link to an image if you have one hosted elsewhere
                  </p>
                </div>
              </div>

              
              <div className="space-y-6">
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <Camera className="w-4 h-4 inline mr-1" />
                    Upload Evidence Photos
                  </label>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="report-image-upload"
                    />
                    <label htmlFor="report-image-upload" className="cursor-pointer">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Upload photos of the disaster</p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB each</p>
                    </label>
                  </div>

                 
                  {uploadedImages.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {uploadedImages.map((image) => {
                        const verificationResult = verificationResults[image.id];
                        return (
                          <div 
                            key={image.id} 
                            className={`border-2 rounded-lg p-3 transition-all ${getVerificationColor(verificationResult)}`}
                          >
                            <div className="flex items-center space-x-3">
                              <img
                                src={image.preview}
                                alt={image.name}
                                className="w-16 h-16 object-cover rounded"
                              />
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                  <p className="text-sm font-medium text-gray-900 truncate">{image.name}</p>
                                  {getVerificationIcon(verificationResult)}
                                </div>
                                <p className="text-xs text-gray-500">{(image.file.size / 1024 / 1024).toFixed(2)} MB</p>
                                
                                {verificationResult && (
                                  <div className="mt-2">
                                    <p className="text-xs text-gray-600">
                                      <strong>Verification:</strong> {verificationResult.analysis}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Confidence: {Math.round(verificationResult.confidence * 100)}%
                                    </p>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex flex-col space-y-1">
                                {!image.verified && (
                                  <button
                                    type="button"
                                    onClick={() => verifyImage(image.id)}
                                    disabled={isVerifying}
                                    className="p-1 text-blue-600 hover:text-blue-700 disabled:text-gray-400"
                                    title="Verify image"
                                  >
                                    {isVerifying ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Shield className="w-4 h-4" />
                                    )}
                                  </button>
                                )}
                                
                                <button
                                  type="button"
                                  onClick={() => removeImage(image.id)}
                                  className="p-1 text-red-500 hover:text-red-700"
                                  title="Remove image"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-blue-900 mb-2">Report Guidelines</h3>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>• Provide accurate and current information</li>
                    <li>• Include specific details about immediate needs</li>
                    <li>• Upload clear photos if available</li>
                    <li>• Verify images for authenticity when possible</li>
                    <li>• Include contact info for follow-up if needed</li>
                  </ul>
                </div>
              </div>
            </div>

            
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <div className="flex items-center space-x-4">
                <div className={`flex items-center space-x-2 text-sm ${
                  isValid ? 'text-green-600' : 'text-gray-500'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${isValid ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span>{isValid ? 'Report is ready to submit' : 'Please complete required fields'}</span>
                </div>

                {uploadedImages.length > 0 && (
                  <div className="text-sm text-gray-500">
                    {uploadedImages.filter(img => img.verified).length} of {uploadedImages.length} images verified
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => navigate('/disasters')}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  disabled={isSubmitting || !isValid}
                  className="flex items-center space-x-2 px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:transform-none"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Report</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default ReportForm;